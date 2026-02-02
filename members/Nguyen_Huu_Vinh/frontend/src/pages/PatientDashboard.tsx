import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

interface MedicalImage {
  id: string
  image_url: string
  upload_date: string
  status: 'pending' | 'processing' | 'analyzed'
}

interface AnalysisResult {
  id: string
  risk_level: 'low' | 'medium' | 'high'
  confidence_score: number
  findings: any
  doctor_notes?: string
  created_at: string
}

const PatientDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [images, setImages] = useState<MedicalImage[]>([])
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPatientData()
  }, [])

  const fetchPatientData = async () => {
    try {
      const [imagesResponse, resultsResponse] = await Promise.all([
        axios.get('/api/v1/images/my-images'),
        axios.get('/api/v1/analysis/my-results')
      ])
      
      setImages(imagesResponse.data)
      setResults(resultsResponse.data)
    } catch (error) {
      console.error('Error fetching patient data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">AURA Patient Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Upload Button */}
          <div className="mb-8">
            <Link
              to="/patient/upload"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload New Retinal Image
            </Link>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Images</dt>
                      <dd className="text-lg font-medium text-gray-900">{images.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Analysis</dt>
                      <dd className="text-lg font-medium text-gray-900">{results.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Analysis</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {images.filter(img => img.status !== 'analyzed').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Analysis Results */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Analysis Results</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest retinal image analysis results.</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <li className="px-4 py-4 text-center text-gray-500">
                  No analysis results yet. Upload your first retinal image to get started.
                </li>
              ) : (
                results.map((result) => (
                  <li key={result.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(result.risk_level)}`}>
                            {result.risk_level.toUpperCase()} RISK
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            Confidence: {(result.confidence_score * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(result.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {result.doctor_notes && (
                        <div className="text-sm text-gray-600 max-w-xs">
                          <p className="font-medium">Doctor Notes:</p>
                          <p>{result.doctor_notes}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PatientDashboard
