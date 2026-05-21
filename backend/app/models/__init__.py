"""
SQLAlchemy models
"""
from app.models.agency import Agency, SubscriptionTier
from app.models.user import User, UserRole
from app.models.job import Job, JobStatus, EmploymentType, ExperienceLevel, JobView
from app.models.client_company import ClientCompany, CompanyProfileView
from app.models.candidate import Candidate, CandidateStatus, CandidateSource
from app.models.application import Application, ApplicationStatus, ApplicationSource, RejectionReason
from app.models.activity import Activity
from app.models.integration import IntegrationConnection
from app.models.job_platform import JobPlatformPosting
from app.models.usage import SubscriptionPlanLimits, CompanyUsageTracking, UsageLog, UsageAlert
from app.models.automation import (
    AutomatedScreeningResult,
    VideoScreeningTemplate,
    VideoScreeningInvitation,
    VideoScreeningResponse,
    VideoScreeningResult,
    SourcingCampaign,
    SourcingProspect,
    InterviewAvailabilitySlot,
    ScheduledInterview,
    InterviewTranscript,
    JobGenerationRequest,
    MessageTemplate,
    AutomatedMessage,
    AIAutomationMetric,
    AIProviderConfig,
    AIDecision,
    AIDecisionAuditLog
)
from app.models.subscription import (
    SubscriptionPlan,
    RecruiterSubscription,
    PaymentTransaction,
    Invoice,
    RecruiterSeat,
    FeatureUsage,
    PayFastWebhook
)
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference

__all__ = [
    "Agency",
    "SubscriptionTier",
    "User",
    "UserRole",
    "Job",
    "JobStatus",
    "EmploymentType",
    "ExperienceLevel",
    "JobView",
    "ClientCompany",
    "CompanyProfileView",
    "Candidate",
    "CandidateStatus",
    "CandidateSource",
    "Application",
    "ApplicationStatus",
    "ApplicationSource",
    "RejectionReason",
    "Activity",
    "IntegrationConnection",
    "JobPlatformPosting",
    "SubscriptionPlanLimits",
    "CompanyUsageTracking",
    "UsageLog",
    "UsageAlert",
    "AutomatedScreeningResult",
    "VideoScreeningTemplate",
    "VideoScreeningInvitation",
    "VideoScreeningResponse",
    "VideoScreeningResult",
    "SourcingCampaign",
    "SourcingProspect",
    "InterviewAvailabilitySlot",
    "ScheduledInterview",
    "InterviewTranscript",
    "JobGenerationRequest",
    "MessageTemplate",
    "AutomatedMessage",
    "AIAutomationMetric",
    "AIProviderConfig",
    "AIDecision",
    "AIDecisionAuditLog",
    "SubscriptionPlan",
    "RecruiterSubscription",
    "PaymentTransaction",
    "Invoice",
    "RecruiterSeat",
    "FeatureUsage",
    "PayFastWebhook",
    "Notification",
    "NotificationPreference",
]