import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-primary mb-4">
              RecruitPro SA
            </h1>
            <p className="text-2xl text-gray-600 mb-2">
              South African Recruitment ATS
            </p>
            <p className="text-lg text-gray-500">
              Infinite Tech. Limitless Solutions.
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
              Frontend is Running! 🎉
            </h2>
            
            <p className="text-center text-gray-600 text-lg mb-6">
              Your React + Vite + TypeScript + Tailwind CSS setup is working perfectly.
            </p>

            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-success mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">React 18</p>
                  <p className="text-sm text-gray-600">Latest React with hooks</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-success mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">TypeScript</p>
                  <p className="text-sm text-gray-600">Type-safe development</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-success mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">Tailwind CSS</p>
                  <p className="text-sm text-gray-600">Utility-first styling</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-success mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-800">Vite</p>
                  <p className="text-sm text-gray-600">Lightning fast HMR</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="bg-gradient-to-r from-primary to-primary-700 rounded-lg shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Build! 🚀</h3>
            <p className="mb-4">
              Your project is fully configured and ready for development. Follow the wireframes 
              to build the complete recruitment ATS.
            </p>
            
            <div className="space-y-2 text-sm">
              <p>📖 Review wireframes in <code className="bg-white/20 px-2 py-1 rounded">wireframes/index.html</code></p>
              <p>📋 Check project plan in <code className="bg-white/20 px-2 py-1 rounded">SA_Recruitment_ATS_Project_Plan.xlsx</code></p>
              <p>🔧 Backend API running at <code className="bg-white/20 px-2 py-1 rounded">http://localhost:8000/docs</code></p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p className="mb-2">Built by InfinityWork IT Solutions (Pty) Ltd</p>
            <p>Cape Town, South Africa 🇿🇦</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
