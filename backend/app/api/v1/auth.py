"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_current_active_user, decode_token
from app.models import User
from app.schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
    PasswordChange,
    CandidateRegisterRequest,
    CompanyRegisterRequest,
    UserUpdate,
)
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    registration: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new agency with first user
    
    Creates:
    - New agency with 14-day trial
    - First user as agency_admin
    - Returns JWT tokens for immediate login
    
    **Note**: Email verification required before full access
    """
    # Create agency and user
    agency, user = await auth_service.register_agency_and_user(db, registration)
    
    # Create tokens for immediate login
    tokens = auth_service.create_tokens(user)
    
    # SEND EMAILS
    try:
        from app.services.email_automation_service import EmailAutomationService
        import uuid
        # 1. Verification to user
        await EmailAutomationService.send_verification_email(
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            verification_token=str(uuid.uuid4())
        )
        # 2. Alert to Admin
        await EmailAutomationService.send_admin_registration_notification({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role.value,
            "city": registration.agency.city if hasattr(registration.agency, 'city') else "Unknown",
            "province": registration.agency.province if hasattr(registration.agency, 'province') else "Unknown"
        })
    except Exception as e:
        print(f"Registration emails failed: {e}")
    
    return RegisterResponse(
        message="Registration successful! Please verify your email.",
        agency_id=agency.id,
        user_id=user.id,
        tokens=TokenResponse(**tokens)
    )


@router.post("/register/candidate", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_candidate(
    registration: CandidateRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new candidate"""
    candidate, user = await auth_service.register_candidate(db, registration.candidate, registration.user)
    tokens = auth_service.create_tokens(user)
    
    # SEND EMAILS
    try:
        from app.services.email_automation_service import EmailAutomationService
        import uuid
        # 1. Verification to candidate
        await EmailAutomationService.send_verification_email(
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            verification_token=str(uuid.uuid4())
        )
        # 2. Alert to Admin
        await EmailAutomationService.send_admin_registration_notification({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": "candidate",
            "city": registration.candidate.city if hasattr(registration.candidate, 'city') else "Unknown",
            "province": registration.candidate.province if hasattr(registration.candidate, 'province') else "Unknown"
        })
    except Exception as e:
        print(f"Candidate registration emails failed: {e}")
        
    return RegisterResponse(
        message="Candidate registration successful!",
        user_id=user.id,
        agency_id=user.agency_id,
        tokens=TokenResponse(**tokens)
    )


@router.post("/register/company", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_company(
    registration: CompanyRegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new company and admin user"""
    company, user = await auth_service.register_company(db, registration.company, registration.user)
    tokens = auth_service.create_tokens(user)
    
    # SEND EMAILS
    try:
        from app.services.email_automation_service import EmailAutomationService
        import uuid
        # 1. Verification to client
        await EmailAutomationService.send_verification_email(
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            verification_token=str(uuid.uuid4())
        )
        # 2. Alert to Admin
        await EmailAutomationService.send_admin_registration_notification({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": "client",
            "city": registration.company.city if hasattr(registration.company, 'city') else "Unknown",
            "province": registration.company.province if hasattr(registration.company, 'province') else "Unknown"
        })
    except Exception as e:
        print(f"Company registration emails failed: {e}")
        
    return RegisterResponse(
        message="Company registration successful!",
        user_id=user.id,
        agency_id=user.agency_id,
        tokens=TokenResponse(**tokens)
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens
    
    **Security**:
    - Account locked for 30 minutes after 5 failed attempts
    - Returns 401 if credentials invalid
    - Returns 403 if account locked/inactive
    """
    # Get client IP
    client_ip = request.client.host if request.client else None
    
    # Authenticate user
    user = await auth_service.authenticate_user(
        db,
        credentials.email,
        credentials.password,
        ip_address=client_ip
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Eagerly load agency relationship
    await db.refresh(user, ["agency"])
    
    # Create tokens
    tokens = auth_service.create_tokens(user)
    
    return LoginResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    **Returns**: New access token (refresh token remains valid)
    """
    try:
        # Decode refresh token
        payload = decode_token(refresh_request.refresh_token)
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Get user
        user_id = payload.get("sub")
        user = await auth_service.get_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive"
            )
        
        # Create new access token only
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
            "agency_id": str(user.agency_id),
        }
        
        from app.core.security import create_access_token
        access_token = create_access_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_request.refresh_token,  # Keep same refresh token
            token_type="bearer",
            expires_in=3600
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user information
    """
    # Eagerly load agency relationship
    await db.refresh(current_user, ["agency"])
    
    return UserResponse.model_validate(current_user)

@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user profile (including avatar)
    """
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user
    
    **Note**: Since we use stateless JWT, actual logout is handled client-side
    by removing tokens. This endpoint is for logging/audit purposes.
    """
    # In production, you might want to:
    # 1. Add token to blacklist (Redis)
    # 2. Log logout event
    # 3. Revoke refresh token
    
    return MessageResponse(
        message="Logged out successfully"
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password
    
    **Requires**: Valid access token and current password
    """
    await auth_service.change_password(
        db,
        current_user,
        password_data.current_password,
        password_data.new_password
    )
    
    return MessageResponse(
        message="Password changed successfully"
    )


# TODO: Implement these endpoints in future sprints
@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Request password reset email
    
    **TODO**: Implement email sending with reset token
    """
    # user = await auth_service.get_user_by_email(db, email)
    # if user:
    #     # Generate reset token
    #     # Send email with reset link
    #     pass
    
    # Always return success (don't reveal if email exists)
    return MessageResponse(
        message="If email exists, password reset instructions have been sent"
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Verify user email with token (Simplified version using user_id as token for now)
    """
    from app.services.auth_service import auth_service
    # In a real app, you would decode the JWT or lookup a token table
    # Here we assume token is user_id for simplicity in this demo
    try:
        user = await auth_service.verify_email(db, token)
        return MessageResponse(
            message=f"Success! Email {user.email} has been verified."
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
