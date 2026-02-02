import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Building, Mail, Phone, MapPin, User, FileText } from 'lucide-react'

interface ClinicRegistrationData {
  // Basic Info
  name: string
  email: string
  phone: string
  website: string
  
  // Address
  address: string
  city: string
  country: string
  postal_code: string
  
  // Business Info
  license_number: string
  tax_id: string
  
  // Contact Person
  contact_person_name: string
  contact_person_email: string
  contact_person_phone: string
  
  // Description
  description: string
  specialties: string[]
  facilities: string[]
}

const ClinicRegistration: React.FC = () => {
  const [formData, setFormData] = useState<ClinicRegistrationData>({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    license_number: '',
    tax_id: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: '',
    description: '',
    specialties: [],
    facilities: []
  })
  
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [facilityInput, setFacilityInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (field: keyof ClinicRegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()]
      }))
      setSpecialtyInput('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }))
  }

  const addFacility = () => {
    if (facilityInput.trim() && !formData.facilities.includes(facilityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, facilityInput.trim()]
      }))
      setFacilityInput('')
    }
  }

  const removeFacility = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate success
      setSubmitStatus('success')
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your clinic registration has been submitted successfully. We will review your information and contact you within 2-3 business days.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Our team will review your clinic information</li>
                <li>• We may contact you for additional verification</li>
                <li>• Once approved, you'll receive login credentials</li>
                <li>• You can start using the AURA platform immediately</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Register Your Clinic</h1>
        <p className="text-gray-600 mt-2">
          Join AURA to provide advanced retinal screening services to your patients
        </p>
      </div>

      {submitStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Tell us about your clinic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
            <CardDescription>
              Your clinic location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code *</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>
              Legal and business details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_number">Medical License Number *</Label>
                <Input
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tax_id">Tax ID *</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Person
            </CardTitle>
            <CardDescription>
              Primary contact for your clinic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_person_name">Full Name *</Label>
              <Input
                id="contact_person_name"
                value={formData.contact_person_name}
                onChange={(e) => handleInputChange('contact_person_name', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_person_email">Email Address *</Label>
                <Input
                  id="contact_person_email"
                  type="email"
                  value={formData.contact_person_email}
                  onChange={(e) => handleInputChange('contact_person_email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contact_person_phone">Phone Number *</Label>
                <Input
                  id="contact_person_phone"
                  value={formData.contact_person_phone}
                  onChange={(e) => handleInputChange('contact_person_phone', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Clinic Details</CardTitle>
            <CardDescription>
              Tell us more about your services and facilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Clinic Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                placeholder="Describe your clinic, services, and what makes you unique..."
              />
            </div>

            <div>
              <Label>Medical Specialties</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  placeholder="Add a specialty"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                />
                <Button type="button" onClick={addSpecialty}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>Facilities</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={facilityInput}
                  onChange={(e) => setFacilityInput(e.target.value)}
                  placeholder="Add a facility"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                />
                <Button type="button" onClick={addFacility}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {facility}
                    <button
                      type="button"
                      onClick={() => removeFacility(facility)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ClinicRegistration
