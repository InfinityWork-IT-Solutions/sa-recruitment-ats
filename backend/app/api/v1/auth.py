"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
import os
import shutil
from typing import Optional, Union
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    get_current_user, get_current_active_user, decode_token,
    create_verification_token, decode_verification_token,
)
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
    UnifiedRegisterRequest,
    UserUpdate,
)
from app.schemas.auth import MFASetupResponse, MFAVerifyRequest, MFADisableRequest, MFALoginRequest
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    registration: Union[RegisterRequest, UnifiedRegisterRequest],
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
    if hasattr(registration, 'userType'):
        # Unified registration from the new frontend
        agency, user = await auth_service.register_unified(db, registration)
    else:
        # Legacy/direct agency registration
        agency, user = await auth_service.register_agency_and_user(db, registration)
    
    # Create tokens for immediate login
    tokens = auth_service.create_tokens(user)
    
    # SEND EMAILS
    try:
        from app.services.email_automation_service import EmailAutomationService
        # 1. Verification to user — signed JWT so the link actually works
        await EmailAutomationService.send_verification_email(
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            verification_token=create_verification_token(str(user.id))
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
        agency_id=agency.id if agency else user.agency_id,
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
        await EmailAutomationService.send_verification_email(
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            verification_token=create_verification_token(str(user.id))
        )
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
        await EmailAutomationService.send_verification_email(
            user_email=user.email,
            user_name=f"{user.first_name} {user.last_name}",
            verification_token=create_verification_token(str(user.id))
        )
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


@router.post("/register/recruiter", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_recruiter(
    registration: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new recruiter/agency
    Used by the recruiter subscription flow
    """
    data = await registration.json()
    
    # Map to RegisterRequest format
    from app.schemas import RegisterRequest, AgencyCreate, UserCreate
    from app.models import UserRole
    
    reg_request = RegisterRequest(
        agency=AgencyCreate(
            name=data.get('agency_name'),
            email=data.get('email'),
            city=data.get('city'),
            province=data.get('province'),
            country=data.get('country', 'South Africa'),
            primary_contact_name=f"{data.get('first_name')} {data.get('last_name')}"
        ),
        user=UserCreate(
            email=data.get('email'),
            password=data.get('password'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            phone=data.get('phone'),
            role=UserRole.agency_admin
        )
    )
    
    agency, user = await auth_service.register_agency_and_user(db, reg_request)
    tokens = auth_service.create_tokens(user)
    
    return RegisterResponse(
        message="Recruiter registration successful!",
        user_id=user.id,
        agency_id=agency.id,
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

    # If MFA is enabled, issue a short-lived challenge token instead of full JWT
    if user.mfa_enabled:
        from app.core.security import create_mfa_token
        mfa_token = create_mfa_token({"sub": str(user.id)})
        return LoginResponse(mfa_required=True, mfa_token=mfa_token)

    # Eagerly load relationships
    await db.refresh(user, ["agency", "candidate"])

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
    # Eagerly load relationships
    await db.refresh(current_user, ["agency", "candidate"])
    
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



@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload user avatar picture
    """
    # Create directory if not exists
    os.makedirs("uploads/avatars", exist_ok=True)
    
    # Generate filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"avatar_{current_user.id}{ext}"
    filepath = f"uploads/avatars/{filename}"
    
    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user record
    # Prefix with /static to match the mount point in main.py
    avatar_url = f"http://localhost:8000/static/{filepath}"
    current_user.avatar_url = avatar_url
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return {"avatar_url": avatar_url}


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


# ---------------------------------------------------------------------------
# MFA endpoints
# ---------------------------------------------------------------------------

@router.post("/mfa/setup", response_model=MFASetupResponse)
async def mfa_setup(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a TOTP secret and return the otpauth:// URI for QR code display.
    Call this to initialise setup; the secret is saved but MFA is not yet active
    until the user confirms with /mfa/verify-setup."""
    import pyotp
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="RecruitPro ATS")
    current_user.mfa_secret = secret
    await db.commit()
    return MFASetupResponse(secret=secret, otpauth_url=uri)


@router.post("/mfa/verify-setup", response_model=MessageResponse)
async def mfa_verify_setup(
    data: MFAVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm a TOTP code to activate 2FA on the account."""
    import pyotp
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="Call /auth/mfa/setup first")
    if not pyotp.TOTP(current_user.mfa_secret).verify(data.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid authentication code")
    current_user.mfa_enabled = True
    await db.commit()
    return MessageResponse(message="Two-factor authentication has been enabled")


@router.delete("/mfa/disable", response_model=MessageResponse)
async def mfa_disable(
    data: MFADisableRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Disable 2FA after verifying the current TOTP code."""
    import pyotp
    if not current_user.mfa_enabled or not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled on this account")
    if not pyotp.TOTP(current_user.mfa_secret).verify(data.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid authentication code")
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    await db.commit()
    return MessageResponse(message="Two-factor authentication has been disabled")


@router.post("/mfa/complete", response_model=LoginResponse)
async def mfa_complete(
    data: MFALoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Second step of MFA login. Exchange the challenge token + TOTP code for full JWT tokens."""
    import pyotp
    try:
        payload = decode_token(data.mfa_token)
    except HTTPException:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired MFA token")

    if payload.get("type") != "mfa_pending":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid MFA token type")

    user_id = payload.get("sub")
    user = await auth_service.get_user_by_id(db, user_id)
    if not user or not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA state invalid")

    if not pyotp.TOTP(user.mfa_secret).verify(data.code, valid_window=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authentication code")

    await db.refresh(user, ["agency", "candidate"])
    tokens = auth_service.create_tokens(user)
    return LoginResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenResponse(**tokens)
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
    """Verify a user's email address using the signed JWT from the verification email."""
    user_id = decode_verification_token(token)   # raises 400 if invalid/expired
    user = await auth_service.verify_email(db, user_id)
    return MessageResponse(message=f"Email {user.email} verified successfully. You can now log in.")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    current_user: User = Depends(get_current_active_user),
):
    """Re-send the verification email to the currently authenticated user."""
    if current_user.is_verified:
        return MessageResponse(message="Your email is already verified.")
    try:
        from app.services.email_automation_service import EmailAutomationService
        await EmailAutomationService.send_verification_email(
            user_email=current_user.email,
            user_name=f"{current_user.first_name} {current_user.last_name}",
            verification_token=create_verification_token(str(current_user.id))
        )
    except Exception as e:
        print(f"Resend verification failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")
    return MessageResponse(message="Verification email sent. Please check your inbox.")
