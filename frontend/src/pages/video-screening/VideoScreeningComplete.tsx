/**
 * ════════════════════════════════════════════════════════════════════════════════
 * 🎉 VIDEO SCREENING COMPLETE PAGE - THANK YOU & CELEBRATION
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * --------
 * This is the FINAL page in the candidate journey. It celebrates their completion,
 * explains what happens next, and sets expectations for response time.
 * 
 * WHEN IT'S USED:
 * ---------------
 * - After candidate successfully submits all video responses
 * - URL: /video-screening/{access_token}/complete
 * - This is the endpoint of the candidate's video screening journey
 * 
 * WHAT IT DOES:
 * -------------
 * ✅ Celebrates completion with confetti animation 🎊
 * ✅ Shows "🎉 Submitted!" success message
 * ✅ Displays job title & company they applied for
 * ✅ Explains "What Happens Next" (3-step timeline)
 * ✅ Shows expected response time (3-5 business days)
 * ✅ Provides tips while waiting
 * ✅ Shows contact information
 * 
 * USER FLOW:
 * ----------
 * 1. Candidate submits all videos on VideoRecordingPage
 * 2. Upload completes successfully
 * 3. → Navigated to THIS page
 * 4. Confetti animation plays (celebration!)
 * 5. Candidate reads what happens next
 * 6. Candidate closes tab / waits for email response
 * 
 * "WHAT HAPPENS NEXT" TIMELINE:
 * -----------------------------
 * Step 1: 👥 Our team reviews your videos
 *         "The recruitment team will carefully review your video responses"
 * 
 * Step 2: ✨ AI assists with initial screening
 *         "Our AI helps analyze your responses for fair evaluation"
 * 
 * Step 3: 📧 You'll hear from us soon
 *         "We typically respond within 3-5 business days with next steps"
 * 
 * API ENDPOINT USED:
 * ------------------
 * GET /api/video-screening/{access_token}/completion-info
 * 
 * Returns:
 * {
 *   "job_title": "Senior Python Developer",
 *   "company_name": "TechCorp",
 *   "submitted_at": "2026-04-20T14:30:00Z",
 *   "expected_response_days": 5    // Business days
 * }
 * 
 * CONFETTI ANIMATION:
 * -------------------
 * - Creates 50 confetti pieces
 * - Random colors (blue, purple, green, orange, red)
 * - Falls from top to bottom
 * - Rotates 360° during fall
 * - Self-removes after 5 seconds
 * - Triggered on component mount (useEffect)
 * 
 * VISUAL ELEMENTS:
 * ----------------
 * 🎉 Bouncing green checkmark icon
 * 📋 Three-step "What Happens Next" timeline
 * 📅 Expected response date calculation
 * 💡 "Tips While Waiting" box
 * 🔒 Privacy reassurance
 * 
 * TIPS WHILE WAITING:
 * -------------------
 * ✅ Keep an eye on your email (check spam folder!)
 * ✅ Research {company_name} to learn more about us
 * ✅ Prepare questions you'd like to ask in an interview
 * ✅ Continue your job search - don't put all eggs in one basket!
 * 
 * EXPECTED RESPONSE CALCULATION:
 * ------------------------------
 * - Takes expected_response_days from API (e.g., 5)
 * - Adds to current date
 * - Displays in friendly format:
 *   "You should hear back by Friday, May 3rd, 2026"
 * 
 * DATE FORMATTING:
 * ----------------
 * Uses South African locale (en-ZA):
 * - Format: "Friday, May 3rd, 2026"
 * - Includes day of week for clarity
 * - Full month name (not abbreviated)
 * 
 * PSYCHOLOGICAL BENEFITS:
 * -----------------------
 * 🎊 Confetti reduces anxiety (fun, positive reinforcement)
 * ⏰ Clear timeline manages expectations (reduces uncertainty)
 * 💡 Tips give candidate productive actions (reduces waiting stress)
 * 🔒 Privacy reassurance builds trust
 * 
 * NO FURTHER ACTIONS:
 * -------------------
 * This page has no buttons or forms - it's purely informational.
 * Candidate journey is complete at this point.
 * Next interaction will be via email (invitation or rejection).
 * 
 * ERROR HANDLING:
 * ---------------
 * - If completion-info API fails → Shows generic message
 * - Defaults to "3-5 days" if expected_response_days not provided
 * - Gracefully handles missing company name
 * 
 * MOBILE CONSIDERATIONS:
 * ----------------------
 * ✅ Responsive layout (stacks nicely on mobile)
 * ✅ Confetti works on touch devices
 * ✅ Easy to read on small screens
 * 
 * CUSTOMIZATION POINTS:
 * ---------------------
 * - Confetti colors (currently blue/purple/green/orange/red)
 * - Number of confetti pieces (currently 50)
 * - Timeline steps (currently 3 steps)
 * - Tips content (add/remove as needed)
 * - Expected response days (set in backend)
 * 
 * ANALYTICS TRACKING:
 * -------------------
 * Consider adding:
 * - Page view event (screening completed)
 * - Time spent on page
 * - Whether candidate clicked company link
 * 
 * TESTING CHECKLIST:
 * ------------------
 * [ ] Confetti animation plays on load
 * [ ] Job title displays correctly
 * [ ] Company name displays correctly
 * [ ] Expected response date calculates correctly
 * [ ] Timeline steps are clear and readable
 * [ ] Tips display properly
 * [ ] Mobile responsive layout works
 * 
 * BACKEND TRIGGERS:
 * -----------------
 * When screening marked complete (POST /complete):
 * 1. Backend saves submission timestamp
 * 2. Backend queues AI analysis job (AssemblyAI + GPT-4)
 * 3. Backend sends confirmation email to candidate
 * 4. Backend notifies recruiter (new screening to review)
 * 
 * NEXT STEPS FOR CANDIDATE:
 * --------------------------
 * 1. Wait for email response (3-5 days)
 * 2. If invited → Schedule interview
 * 3. If rejected → Receive kind rejection email
 * 
 * RECRUITER'S VIEW (BACKEND):
 * ---------------------------
 * While candidate sees this page:
 * - AI is transcribing videos (AssemblyAI)
 * - AI is analyzing responses (GPT-4)
 * - AI is generating scores (Content, Communication, Technical)
 * - AI is creating report card (Strengths, Concerns, Recommendation)
 * - Recruiter will see screening on their dashboard
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Calendar, Mail, Users, Sparkles } from 'lucide-react';

interface CompletionInfo {
  job_title: string;
  company_name: string;
  submitted_at: string;
  expected_response_days: number;
}

export default function VideoScreeningComplete() {
  const { access_token } = useParams<{ access_token: string }>();
  const [info, setInfo] = useState<CompletionInfo | null>(null);

  useEffect(() => {
    fetchCompletionInfo();
    
    // Confetti effect
    celebrate();
  }, []);

  const fetchCompletionInfo = async () => {
    try {
      const response = await fetch(`/api/v1/video-screening/completion-info/${access_token}`);
      if (response.ok) {
        const data = await response.json();
        setInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch completion info:', err);
    }
  };

  const celebrate = () => {
    // Simple celebration animation
    const confettiColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        confetti.style.animationDelay = Math.random() * 3 + 's';
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
      }, i * 30);
    }
  };

  return (
    <>
      <style>{`
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          top: -10px;
          z-index: 9999;
          animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6 animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🎉 Submitted!
            </h1>
            <p className="text-2xl text-gray-600">
              Your video screening is complete
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8 text-white text-center">
              <h2 className="text-3xl font-bold mb-2">
                Thank You!
              </h2>
              <p className="text-green-100 text-lg">
                We've received your video responses for
              </p>
              <p className="text-2xl font-bold mt-2">
                {info?.job_title || 'the position'}
              </p>
              <p className="text-green-100">
                at {info?.company_name || 'our company'}
              </p>
            </div>

            {/* Content */}
            <div className="p-8">

              {/* What Happens Next */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
                  What Happens Next?
                </h3>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        1. Our team reviews your videos
                      </div>
                      <div className="text-gray-600">
                        The recruitment team will carefully review your video responses along with your application.
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        2. AI assists with initial screening
                      </div>
                      <div className="text-gray-600">
                        Our AI helps analyze your responses to ensure fair and thorough evaluation.
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        3. You'll hear from us soon
                      </div>
                      <div className="text-gray-600">
                        We typically respond within <strong>{info?.expected_response_days || '3-5'} business days</strong> with next steps.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                  <strong className="text-blue-900">Expected Response Time</strong>
                </div>
                <p className="text-blue-800">
                  You should hear back from us by{' '}
                  <strong>
                    {new Date(Date.now() + (info?.expected_response_days || 5) * 24 * 60 * 60 * 1000)
                      .toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </strong>
                </p>
              </div>

              {/* Tips While Waiting */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
                <div className="flex items-start">
                  <div className="text-3xl mr-3">💡</div>
                  <div>
                    <h4 className="font-bold text-yellow-900 mb-2">While You Wait</h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li>✅ Keep an eye on your email (check spam folder too!)</li>
                      <li>✅ Research {info?.company_name || 'the company'} to learn more about us</li>
                      <li>✅ Prepare questions you'd like to ask in an interview</li>
                      <li>✅ Continue your job search - don't put all eggs in one basket!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Have questions? Feel free to contact {info?.company_name || 'us'} directly.
                </p>
                <div className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold">
                  <Mail className="w-5 h-5 mr-2" />
                  Check your email for contact details
                </div>
              </div>

            </div>
          </div>

          {/* Social Share (Optional) */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Powered by <strong>RecruitPro SA</strong> - AI-Powered Recruitment
            </p>
            <p className="text-xs text-gray-400">
              Submitted on {info?.submitted_at 
                ? new Date(info.submitted_at).toLocaleDateString('en-ZA', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'just now'
              }
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
