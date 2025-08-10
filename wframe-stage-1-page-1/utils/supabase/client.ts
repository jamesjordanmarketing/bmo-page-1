import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export class FileUploadService {
  private baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0fb30735`

  async uploadFile(file: File, projectId: string = 'default') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  }

  async getFiles(projectId: string = 'default') {
    const response = await fetch(`${this.baseUrl}/files/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get files')
    }

    return response.json()
  }

  async deleteFile(fileId: string) {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete file')
    }

    return response.json()
  }

  async startAnalysis(projectId: string = 'default', config: any) {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ projectId, config })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to start analysis')
    }

    return response.json()
  }

  async getStatus(projectId: string = 'default') {
    const response = await fetch(`${this.baseUrl}/status/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get status')
    }

    return response.json()
  }

  async saveConfig(projectId: string = 'default', config: any) {
    const response = await fetch(`${this.baseUrl}/config/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify(config)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save configuration')
    }

    return response.json()
  }

  async getConfig(projectId: string = 'default') {
    const response = await fetch(`${this.baseUrl}/config/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get configuration')
    }

    return response.json()
  }
}

export const fileService = new FileUploadService()