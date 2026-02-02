import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const UploadImage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      setFile(selectedFile)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select an image to upload')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      await axios.post('/api/v1/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setSuccess('Image uploaded successfully! AI analysis is in progress...')
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/patient/dashboard')
      }, 3000)
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview('')
    setError('')
    setSuccess('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Upload Retinal Image
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Upload your retinal image for AI analysis. The system will analyze the image for potential health risks.
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div className="flex justify-center">
                <div className="w-full max-w-lg">
                  <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Retinal Image
                  </label>
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      {preview ? (
                        <div className="mb-4">
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="mx-auto h-64 w-auto object-cover rounded-lg shadow-md"
                          />
                        </div>
                      ) : (
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{success}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload & Analyze'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Information Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>After uploading your retinal image:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Our AI system will analyze the image for vascular abnormalities</li>
                  <li>Analysis typically takes 5-10 seconds</li>
                  <li>You'll receive a risk assessment and confidence score</li>
                  <li>A medical professional can review and validate the results</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadImage
