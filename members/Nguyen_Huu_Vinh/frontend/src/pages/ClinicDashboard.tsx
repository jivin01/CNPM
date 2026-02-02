import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Users, 
  Upload, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  CreditCard,
  Activity,
  Eye,
  Download
} from 'lucide-react'

interface ClinicData {
  clinic_info: {
    name: string
    status: string
    current_package: string
    analysis_credits: number
  }
  statistics: {
    total_patients: number
    total_images: number
    total_analyses: number
    high_risk_cases: number
    staff_count: number
  }
  risk_distribution: {
    low: number
    medium: number
    high: number
  }
  recent_activity: {
    recent_images: number
    recent_analyses: number
  }
}

interface AlertData {
  type: string
  severity: string
  message: string
  action: string
}

const ClinicDashboard: React.FC = () => {
  const [clinicData, setClinicData] = useState<ClinicData | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClinicData()
    fetchAlerts()
  }, [])

  const fetchClinicData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: ClinicData = {
        clinic_info: {
          name: "Bệnh viện Mắt ABC",
          status: "verified",
          current_package: "premium",
          analysis_credits: 150
        },
        statistics: {
          total_patients: 245,
          total_images: 892,
          total_analyses: 856,
          high_risk_cases: 23,
          staff_count: 8
        },
        risk_distribution: {
          low: 680,
          medium: 153,
          high: 23
        },
        recent_activity: {
          recent_images: 47,
          recent_analyses: 45
        }
      }
      setClinicData(mockData)
    } catch (error) {
      console.error('Error fetching clinic data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      // Mock alerts - replace with actual API call
      const mockAlerts: AlertData[] = [
        {
          type: "low_credits",
          severity: "warning",
          message: "Low analysis credits: 150 remaining",
          action: "purchase_credits"
        },
        {
          type: "high_risk_patients",
          severity: "critical",
          message: "5 high-risk patients detected in the last 7 days",
          action: "review_patients"
        }
      ]
      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!clinicData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load clinic data</p>
      </div>
    )
  }

  const totalRisks = clinicData.risk_distribution.low + clinicData.risk_distribution.medium + clinicData.risk_distribution.high

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{clinicData.clinic_info.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={getStatusColor(clinicData.clinic_info.status)}>
              {clinicData.clinic_info.status}
            </Badge>
            <span className="text-sm text-gray-500">
              Package: {clinicData.clinic_info.current_package}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className={getSeverityColor(alert.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="capitalize">{alert.type.replace('_', ' ')}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData.statistics.total_patients}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData.statistics.total_images}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clinicData.clinic_info.analysis_credits}</div>
            <Progress value={(clinicData.clinic_info.analysis_credits / 500) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clinicData.statistics.high_risk_cases}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Analysis results by risk level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Low Risk</span>
                    <span>{clinicData.risk_distribution.low} ({Math.round((clinicData.risk_distribution.low / totalRisks) * 100)}%)</span>
                  </div>
                  <Progress value={(clinicData.risk_distribution.low / totalRisks) * 100} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Medium Risk</span>
                    <span>{clinicData.risk_distribution.medium} ({Math.round((clinicData.risk_distribution.medium / totalRisks) * 100)}%)</span>
                  </div>
                  <Progress value={(clinicData.risk_distribution.medium / totalRisks) * 100} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>High Risk</span>
                    <span>{clinicData.risk_distribution.high} ({Math.round((clinicData.risk_distribution.high / totalRisks) * 100)}%)</span>
                  </div>
                  <Progress value={(clinicData.risk_distribution.high / totalRisks) * 100} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Images Uploaded</span>
                  </div>
                  <span className="font-semibold">{clinicData.recent_activity.recent_images}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Analyses Completed</span>
                  </div>
                  <span className="font-semibold">{clinicData.recent_activity.recent_analyses}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">New Patients</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>Detailed analytics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analytics charts will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">Integration with charting library needed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>View and manage patient records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Patient List
                </Button>
                <Button size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Add New Patient
                </Button>
              </div>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Patient list will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">Table component integration needed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage clinic staff and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                  Total Staff: {clinicData.statistics.staff_count}
                </div>
                <Button size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Staff
                </Button>
              </div>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Staff list will be displayed here</p>
                <p className="text-sm text-gray-400 mt-2">Staff management component needed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClinicDashboard
