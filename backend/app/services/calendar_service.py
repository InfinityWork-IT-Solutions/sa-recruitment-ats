"""
Google Calendar integration service for interview scheduling
"""
from datetime import datetime, timedelta
from typing import Dict, Optional
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pytz

from app.core.config import settings


class CalendarService:
    """Google Calendar integration service"""
    
    def __init__(self):
        """Initialize Google Calendar client"""
        # Use service account for server-to-server authentication
        self.credentials = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_SERVICE_ACCOUNT_FILE,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        self.calendar_service = build('calendar', 'v3', credentials=self.credentials)
        self.calendar_id = settings.GOOGLE_CALENDAR_ID or 'primary'
    
    async def create_interview_event(
        self,
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        interview_datetime: datetime,
        duration_minutes: int = 60,
        interviewer_email: Optional[str] = None,
        location: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Create interview event in Google Calendar
        
        Args:
            candidate_name: Candidate's name
            candidate_email: Candidate's email
            job_title: Job title
            interview_datetime: Interview date and time
            duration_minutes: Interview duration (default 60 min)
            interviewer_email: Interviewer's email
            location: Interview location
            notes: Additional notes
            
        Returns:
            Event details with calendar link
        """
        try:
            # Calculate end time
            end_datetime = interview_datetime + timedelta(minutes=duration_minutes)
            
            # Create event
            event = {
                'summary': f'Interview: {candidate_name} - {job_title}',
                'location': location or 'To be confirmed',
                'description': self._format_interview_description(
                    candidate_name,
                    candidate_email,
                    job_title,
                    notes
                ),
                'start': {
                    'dateTime': interview_datetime.isoformat(),
                    'timeZone': 'Africa/Johannesburg',
                },
                'end': {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'Africa/Johannesburg',
                },
                'attendees': self._build_attendees_list(candidate_email, interviewer_email),
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 60},       # 1 hour before
                    ],
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': f'interview_{candidate_name}_{interview_datetime.timestamp()}',
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                }
            }
            
            # Create event
            created_event = self.calendar_service.events().insert(
                calendarId=self.calendar_id,
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'  # Send email to all attendees
            ).execute()
            
            return {
                'event_id': created_event['id'],
                'calendar_link': created_event.get('htmlLink'),
                'meet_link': created_event.get('hangoutLink'),
                'status': 'created'
            }
            
        except HttpError as error:
            return {
                'error': f'Calendar event creation failed: {str(error)}',
                'status': 'failed'
            }
    
    def _format_interview_description(
        self,
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        notes: Optional[str]
    ) -> str:
        """Format interview event description"""
        description = f"""
Interview Details:
==================

Candidate: {candidate_name}
Email: {candidate_email}
Position: {job_title}

What to prepare:
- Review candidate's resume
- Prepare technical questions
- Review job requirements

"""
        if notes:
            description += f"\nAdditional Notes:\n{notes}"
        
        return description
    
    def _build_attendees_list(
        self,
        candidate_email: str,
        interviewer_email: Optional[str]
    ) -> list:
        """Build list of event attendees"""
        attendees = [{'email': candidate_email, 'responseStatus': 'needsAction'}]
        
        if interviewer_email:
            attendees.append({'email': interviewer_email, 'organizer': True})
        
        return attendees
    
    async def update_interview_event(
        self,
        event_id: str,
        new_datetime: Optional[datetime] = None,
        new_location: Optional[str] = None,
        new_notes: Optional[str] = None
    ) -> Dict:
        """
        Update existing interview event
        
        Args:
            event_id: Google Calendar event ID
            new_datetime: New interview datetime
            new_location: New location
            new_notes: Updated notes
            
        Returns:
            Updated event details
        """
        try:
            # Get existing event
            event = self.calendar_service.events().get(
                calendarId=self.calendar_id,
                eventId=event_id
            ).execute()
            
            # Update fields
            if new_datetime:
                duration_minutes = 60  # Default
                end_datetime = new_datetime + timedelta(minutes=duration_minutes)
                
                event['start'] = {
                    'dateTime': new_datetime.isoformat(),
                    'timeZone': 'Africa/Johannesburg',
                }
                event['end'] = {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'Africa/Johannesburg',
                }
            
            if new_location:
                event['location'] = new_location
            
            if new_notes:
                current_description = event.get('description', '')
                event['description'] = f"{current_description}\n\nUpdate: {new_notes}"
            
            # Update event
            updated_event = self.calendar_service.events().update(
                calendarId=self.calendar_id,
                eventId=event_id,
                body=event,
                sendUpdates='all'  # Notify all attendees
            ).execute()
            
            return {
                'event_id': updated_event['id'],
                'calendar_link': updated_event.get('htmlLink'),
                'status': 'updated'
            }
            
        except HttpError as error:
            return {
                'error': f'Event update failed: {str(error)}',
                'status': 'failed'
            }
    
    async def cancel_interview_event(
        self,
        event_id: str,
        cancellation_reason: Optional[str] = None
    ) -> Dict:
        """
        Cancel interview event
        
        Args:
            event_id: Google Calendar event ID
            cancellation_reason: Reason for cancellation
            
        Returns:
            Cancellation status
        """
        try:
            # Get event and add cancellation note
            if cancellation_reason:
                event = self.calendar_service.events().get(
                    calendarId=self.calendar_id,
                    eventId=event_id
                ).execute()
                
                event['description'] = f"{event.get('description', '')}\n\nCANCELLED: {cancellation_reason}"
                
                self.calendar_service.events().update(
                    calendarId=self.calendar_id,
                    eventId=event_id,
                    body=event,
                    sendUpdates='all'
                ).execute()
            
            # Delete event
            self.calendar_service.events().delete(
                calendarId=self.calendar_id,
                eventId=event_id,
                sendUpdates='all'  # Send cancellation to all attendees
            ).execute()
            
            return {
                'event_id': event_id,
                'status': 'cancelled'
            }
            
        except HttpError as error:
            return {
                'error': f'Event cancellation failed: {str(error)}',
                'status': 'failed'
            }
    
    async def get_interviewer_availability(
        self,
        interviewer_email: str,
        start_date: datetime,
        end_date: datetime
    ) -> list:
        """
        Get interviewer's busy times
        
        Args:
            interviewer_email: Interviewer's email
            start_date: Start of time range
            end_date: End of time range
            
        Returns:
            List of busy time slots
        """
        try:
            body = {
                "timeMin": start_date.isoformat(),
                "timeMax": end_date.isoformat(),
                "timeZone": "Africa/Johannesburg",
                "items": [{"id": interviewer_email}]
            }
            
            freebusy = self.calendar_service.freebusy().query(body=body).execute()
            
            busy_times = freebusy['calendars'][interviewer_email]['busy']
            
            return [
                {
                    'start': slot['start'],
                    'end': slot['end']
                }
                for slot in busy_times
            ]
            
        except HttpError as error:
            return []
    
    async def suggest_interview_slots(
        self,
        interviewer_email: str,
        preferred_date: datetime,
        duration_minutes: int = 60,
        num_slots: int = 5
    ) -> list:
        """
        Suggest available interview time slots
        
        Args:
            interviewer_email: Interviewer's email
            preferred_date: Preferred interview date
            duration_minutes: Interview duration
            num_slots: Number of slots to suggest
            
        Returns:
            List of suggested time slots
        """
        # Get busy times for the week
        start_date = preferred_date.replace(hour=0, minute=0, second=0)
        end_date = start_date + timedelta(days=7)
        
        busy_times = await self.get_interviewer_availability(
            interviewer_email,
            start_date,
            end_date
        )
        
        # Working hours: 9 AM - 5 PM, Monday-Friday
        suggested_slots = []
        current_time = preferred_date
        
        while len(suggested_slots) < num_slots and current_time < end_date:
            # Skip weekends
            if current_time.weekday() >= 5:
                current_time += timedelta(days=1)
                continue
            
            # Check if slot is during working hours
            if 9 <= current_time.hour < 17:
                slot_end = current_time + timedelta(minutes=duration_minutes)
                
                # Check if slot conflicts with busy times
                is_available = True
                for busy in busy_times:
                    busy_start = datetime.fromisoformat(busy['start'].replace('Z', '+00:00'))
                    busy_end = datetime.fromisoformat(busy['end'].replace('Z', '+00:00'))
                    
                    if (current_time < busy_end and slot_end > busy_start):
                        is_available = False
                        break
                
                if is_available:
                    suggested_slots.append({
                        'start': current_time.isoformat(),
                        'end': slot_end.isoformat(),
                        'display': current_time.strftime('%A, %B %d at %I:%M %p')
                    })
            
            # Move to next hour
            current_time += timedelta(hours=1)
        
        return suggested_slots


# Create service instance
calendar_service = CalendarService()
