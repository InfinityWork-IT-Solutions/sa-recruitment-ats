"""
Authentication service - Business logic for auth operations
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models import User, Agency, UserRole
from app.schemas import (
    RegisterRequest,
    LoginRequest,
    UserCreate,
    AgencyCreate,
    CandidateCreate,
    ClientCompanyCreate,
)
from app.models.candidate import Candidate
from app.models.client_company import ClientCompany


class AuthService:
    """Authentication service"""
    
    @staticmethod
    async def get_or_create_system_agency(db: AsyncSession) -> Agency:
        """Get or create the default system agency for independent users"""
        result = await db.execute(select(Agency).where(Agency.name == "RecruitPro Global"))
        agency = result.scalar_one_or_none()
        
        if not agency:
            agency = Agency(
                name="RecruitPro Global",
                email="system@recruitpro.co.za",
                phone="0000000000",
                is_active=True,
                subscription_tier="premium"
            )
            db.add(agency)
            await db.flush()
            
        return agency
    
    @staticmethod
    async def register_agency_and_user(
        db: AsyncSession,
        registration: RegisterRequest
    ) -> Tuple[Agency, User]:
        """
        Register a new agency with first user (agency admin)
        
        Args:
            db: Database session
            registration: Registration data
            
        Returns:
            Tuple of (agency, user)
            
        Raises:
            HTTPException: If email already exists
        """
        # Check if email already exists
        existing_user = await db.execute(
            select(User).where(User.email == registration.user.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create agency
        agency_data = registration.agency.model_dump()
        agency = Agency(**agency_data)
        
        # Set trial period (14 days)
        agency.is_trial = True
        agency.trial_ends_at = datetime.utcnow() + timedelta(days=14)
        
        db.add(agency)
        await db.flush()  # Get agency.id
        
        # Create first user (must be agency admin)
        user_data = registration.user.model_dump(exclude={'password', 'role'})
        user = User(
            **user_data,
            agency_id=agency.id,
            role=UserRole.agency_admin,  # First user is always admin
            hashed_password=hash_password(registration.user.password),
            is_active=True,
            is_verified=False,  # Requires email verification
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(agency)
        await db.refresh(user)
        
        return agency, user

    @staticmethod
    async def register_candidate(
        db: AsyncSession,
        registration: CandidateCreate,
        user_data: UserCreate
    ) -> Tuple[Candidate, User]:
        """Register a new candidate user"""
        # Check if email exists
        existing_user = await db.execute(select(User).where(User.email == user_data.email))
        if existing_user.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Provide system agency if not specified
        agency_id = user_data.agency_id
        if not agency_id:
            system_agency = await AuthService.get_or_create_system_agency(db)
            agency_id = system_agency.id

        # Create user
        user = User(
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=UserRole.candidate,
            hashed_password=hash_password(user_data.password),
            is_active=True,
            agency_id=agency_id
        )
        db.add(user)
        await db.flush()

        # Create candidate profile
        candidate = Candidate(
            user_id=user.id,
            agency_id=agency_id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            **registration.model_dump(exclude={'first_name', 'last_name', 'email', 'phone'})
        )
        db.add(candidate)
        await db.commit()
        await db.refresh(user)
        await db.refresh(candidate)
        return candidate, user

    @staticmethod
    async def register_company(
        db: AsyncSession,
        registration: ClientCompanyCreate,
        user_data: UserCreate
    ) -> Tuple[ClientCompany, User]:
        """Register a new company and its primary admin user"""
        # Check if email exists
        existing_user = await db.execute(select(User).where(User.email == user_data.email))
        if existing_user.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")

        # Link to system agency if not specified
        agency_id = user_data.agency_id
        if not agency_id:
            system_agency = await AuthService.get_or_create_system_agency(db)
            agency_id = system_agency.id

        # Create user
        user = User(
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=UserRole.client,
            hashed_password=hash_password(user_data.password),
            is_active=True,
            agency_id=agency_id
        )
        db.add(user)
        await db.flush()

        # Create company
        company = ClientCompany(
            user_id=user.id,
            agency_id=agency_id,
            **registration.model_dump()
        )
        db.add(company)
        await db.commit()
        await db.refresh(user)
        await db.refresh(company)
        return company, user
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str,
        ip_address: Optional[str] = None
    ) -> Optional[User]:
        """
        Authenticate user by email and password
        
        Args:
            db: Database session
            email: User email
            password: User password
            ip_address: Client IP address
            
        Returns:
            User if authenticated, None otherwise
        """
        # Get user
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked until {user.locked_until.isoformat()}"
            )
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            # Increment failed login attempts
            user.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts (30 minutes)
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Too many failed login attempts. Account locked for 30 minutes."
                )
            
            await db.commit()
            return None
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        user.last_login_ip = ip_address
        user.failed_login_attempts = 0  # Reset on successful login
        user.locked_until = None
        
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    def create_tokens(user: User) -> dict:
        """
        Create access and refresh tokens for user
        
        Args:
            user: User object
            
        Returns:
            Dict with access_token, refresh_token, token_type, expires_in
        """
        # Create token payload
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "agency_id": str(user.agency_id) if user.agency_id else None,
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600,  # 1 hour
        }
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """Get user by ID"""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def verify_email(db: AsyncSession, user_id: str) -> User:
        """Mark user email as verified"""
        user = await AuthService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_verified = True
        user.email_verified_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def change_password(
        db: AsyncSession,
        user: User,
        current_password: str,
        new_password: str
    ) -> User:
        """Change user password"""
        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.hashed_password = hash_password(new_password)
        
        await db.commit()
        await db.refresh(user)
        
        return user


# Create service instance
print("INITIALIZING AUTH_SERVICE OBJECT")
auth_service = AuthService()
print("AUTH_SERVICE.PY FINISHED")
