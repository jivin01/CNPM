import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

interface DashboardItem {
  image_id: string
  patient_name: string
  upload_date: string
  image_url: string
  risk_level: 'low' | 'medium' | 'high' | null
  confidence_score: number | null
  findings: any
  doctor_notes: string | null
  analysis_id: string | null
}

const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<DashboardItem | null>(null)
  const [notes, setNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/v1/analysis/doctor/dashboard')
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateNotes = async () => {
    if (!selectedItem?.analysis_id) return

    setIsUpdating(true)
    try {
      await axios.patch(`/api/v1/analysis/${selectedItem.analysis_id}/validate`, {
        doctor_notes: notes
      })
      
      // Update local state
      setDashboardData(prev => 
        prev.map(item => 
          item.analysis_id === selectedItem.analysis_id 
            ? { ...item, doctor_notes: notes }
            : item
        )
      )
      
      setSelectedItem({ ...selectedItem, doctor_notes: notes })
      setNotes('')
    } catch (error) {
      console.error('Error updating notes:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const getRiskLevelColor = (level: string | null) => {
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-xl font-semibold text-gray-900">AURA Doctor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Dr. {user?.email}</span>
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
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Analysis</dt>
                      <dd className="text-lg font-medium text-gray-900">{dashboardData.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">High Risk</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.filter(item => item.risk_level === 'high').length}
                      </dd>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Medium Risk</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.filter(item => item.risk_level === 'medium').length}
                      </dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Low Risk</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {dashboardData.filter(item => item.risk_level === 'low').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Analysis List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Patient Analysis Results</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Review and validate AI analysis results.</p>
            </div>
            
            {dashboardData.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No analyzed images available yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {dashboardData.map((item) => (
                  <li key={item.image_id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Patient Image Thumbnail */}
                          <div className="flex-shrink-0">
                            <img 
                              className="h-12 w-12 rounded-full object-cover"
                              src={item.image_url}
                              alt={`${item.patient_name}'s retinal image`}
                            />
                          </div>
                          
                          {/* Patient Info */}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.patient_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(item.upload_date).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {/* Risk Level Badge */}
                          <div className="flex-shrink-0">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(item.risk_level)}`}>
                              {item.risk_level?.toUpperCase() || 'PENDING'}
                            </span>
                          </div>
                          
                          {/* Confidence Score */}
                          {item.confidence_score && (
                            <div className="text-sm text-gray-600">
                              {(item.confidence_score * 100).toFixed(1)}% confidence
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item)
                              setNotes(item.doctor_notes || '')
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                      
                      {/* Existing Doctor Notes */}
                      {item.doctor_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm font-medium text-gray-700">Doctor Notes:</p>
                          <p className="text-sm text-gray-600">{item.doctor_notes}</p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Review Analysis - {selectedItem.patient_name}
              </h3>
              
              {/* Image Preview */}
              <div className="mb-4">
                <img 
                  src={selectedItem.image_url}
                  alt="Retinal Image"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              
              {/* Analysis Details */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">AI Analysis Results:</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p><strong>Risk Level:</strong> <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(selectedItem.risk_level)}`}>
                    {selectedItem.risk_level?.toUpperCase()}
                  </span></p>
                  <p><strong>Confidence:</strong> {selectedItem.confidence_score ? (selectedItem.confidence_score * 100).toFixed(1) : 0}%</p>
                  {selectedItem.findings && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Detailed Findings</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                        {JSON.stringify(selectedItem.findings, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
              
              {/* Doctor Notes */}
              <div className="mb-4">
                <label htmlFor="doctor-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Notes:
                </label>
                <textarea
                  id="doctor-notes"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Add your professional assessment and recommendations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setNotes('')
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateNotes}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard
