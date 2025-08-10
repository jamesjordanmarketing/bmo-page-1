import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Create storage buckets on startup
async function initializeStorage() {
  const bucketName = 'make-0fb30735-pipeline-files'
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, { public: false })
      if (error) {
        console.log(`Error creating bucket: ${error.message}`)
      } else {
        console.log(`Created storage bucket: ${bucketName}`)
      }
    }
  } catch (error) {
    console.log(`Error initializing storage: ${error}`)
  }
}

// Initialize sample data for demonstration
async function initializeSampleData() {
  try {
    // Check if sample data already exists
    const existingFiles = await kv.getByPrefix('file:')
    if (existingFiles.length > 0) {
      console.log('Sample data already exists, skipping initialization')
      return
    }

    const sampleFiles = [
      {
        id: 'sample-1',
        name: 'Business_Strategy_2024.pdf',
        originalName: 'Business_Strategy_2024.pdf',
        size: 2457600, // 2.4 MB
        type: 'application/pdf',
        storagePath: 'sample-business-strategy.pdf',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'complete',
        analysisResults: {
          topics: 12,
          entities: 45,
          confidence: 0.92
        },
        analysisCompleted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
      },
      {
        id: 'sample-2',
        name: 'Marketing_Research_Q1.docx',
        originalName: 'Marketing_Research_Q1.docx',
        size: 1843200, // 1.8 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        storagePath: 'sample-marketing-research.docx',
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'analyzing',
        analysisStarted: new Date(Date.now() - 10 * 60 * 1000).toISOString() // Started 10 minutes ago
      },
      {
        id: 'sample-3',
        name: 'Product_Requirements.txt',
        originalName: 'Product_Requirements.txt',
        size: 524288, // 512 KB
        type: 'text/plain',
        storagePath: 'sample-product-requirements.txt',
        uploadDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        status: 'complete',
        analysisResults: {
          topics: 8,
          entities: 23,
          confidence: 0.87
        },
        analysisCompleted: new Date(Date.now() - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString()
      },
      {
        id: 'sample-4',
        name: 'Financial_Report_Draft.docx',
        originalName: 'Financial_Report_Draft.docx',
        size: 3145728, // 3 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        storagePath: 'sample-financial-report.docx',
        uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'complete',
        analysisResults: {
          topics: 15,
          entities: 67,
          confidence: 0.94
        },
        analysisCompleted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString()
      },
      {
        id: 'sample-5',
        name: 'User_Interview_Notes.txt',
        originalName: 'User_Interview_Notes.txt',
        size: 786432, // 768 KB
        type: 'text/plain',
        storagePath: 'sample-user-interviews.txt',
        uploadDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        status: 'queued',
        analysisResults: null
      },
      {
        id: 'sample-6',
        name: 'Competitor_Analysis.pdf',
        originalName: 'Competitor_Analysis.pdf',
        size: 4194304, // 4 MB
        type: 'application/pdf',
        storagePath: 'sample-competitor-analysis.pdf',
        uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        status: 'error',
        analysisResults: null,
        error: 'File format not supported for detailed analysis'
      },
      {
        id: 'sample-7',
        name: 'Team_Meeting_Minutes_Jan.docx',
        originalName: 'Team_Meeting_Minutes_Jan.docx',
        size: 1048576, // 1 MB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        storagePath: 'sample-meeting-minutes.docx',
        uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        status: 'complete',
        analysisResults: {
          topics: 6,
          entities: 18,
          confidence: 0.81
        },
        analysisCompleted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString()
      },
      {
        id: 'sample-8',
        name: 'Project_Roadmap_2024.pdf',
        originalName: 'Project_Roadmap_2024.pdf',
        size: 2097152, // 2 MB
        type: 'application/pdf',
        storagePath: 'sample-project-roadmap.pdf',
        uploadDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
        status: 'complete',
        analysisResults: {
          topics: 9,
          entities: 34,
          confidence: 0.89
        },
        analysisCompleted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString()
      }
    ]

    // Store sample files in KV store
    for (const file of sampleFiles) {
      await kv.set(`file:${file.id}`, file)
    }

    console.log(`Initialized ${sampleFiles.length} sample files for demonstration`)
  } catch (error) {
    console.log(`Error initializing sample data: ${error}`)
  }
}

// Initialize storage and sample data on startup
initializeStorage()
initializeSampleData()

// Upload file endpoint
app.post('/make-server-0fb30735/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Unsupported file type' }, 400)
    }

    const fileName = `${Date.now()}-${file.name}`
    const bucketName = 'make-0fb30735-pipeline-files'
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file)

    if (error) {
      console.log(`Storage upload error: ${error.message}`)
      return c.json({ error: 'Upload failed' }, 500)
    }

    // Store file metadata in KV store
    const fileId = Date.now().toString()
    const fileMetadata = {
      id: fileId,
      name: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      storagePath: fileName,
      uploadDate: new Date().toISOString(),
      status: 'queued',
      analysisResults: null
    }

    await kv.set(`file:${fileId}`, fileMetadata)

    // Get signed URL for frontend access
    const { data: signedUrl } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600) // 1 hour expiry

    return c.json({
      success: true,
      file: {
        ...fileMetadata,
        signedUrl: signedUrl?.signedUrl
      }
    })

  } catch (error) {
    console.log(`File upload error: ${error}`)
    return c.json({ error: 'Internal server error during file upload' }, 500)
  }
})

// Get uploaded files
app.get('/make-server-0fb30735/files', async (c) => {
  try {
    const limit = c.req.query('limit')
    let files = await kv.getByPrefix('file:')
    
    // Sort files by upload date (most recent first)
    files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    
    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        files = files.slice(0, limitNum)
      }
    }
    
    // Create signed URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        try {
          const { data: signedUrl } = await supabase.storage
            .from('make-0fb30735-pipeline-files')
            .createSignedUrl(file.storagePath, 3600)
          
          return {
            ...file,
            signedUrl: signedUrl?.signedUrl
          }
        } catch (error) {
          console.log(`Error creating signed URL for file ${file.id}: ${error}`)
          return file
        }
      })
    )

    return c.json({ files: filesWithUrls })
  } catch (error) {
    console.log(`Error fetching files: ${error}`)
    return c.json({ error: 'Failed to fetch files' }, 500)
  }
})

// Delete file
app.delete('/make-server-0fb30735/files/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId')
    const file = await kv.get(`file:${fileId}`)
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('make-0fb30735-pipeline-files')
      .remove([file.storagePath])

    if (storageError) {
      console.log(`Storage deletion error: ${storageError.message}`)
    }

    // Delete from KV store
    await kv.del(`file:${fileId}`)

    return c.json({ success: true })
  } catch (error) {
    console.log(`Error deleting file: ${error}`)
    return c.json({ error: 'Failed to delete file' }, 500)
  }
})

// Reprocess file
app.post('/make-server-0fb30735/files/:fileId/reprocess', async (c) => {
  try {
    const fileId = c.req.param('fileId')
    const file = await kv.get(`file:${fileId}`)
    
    if (!file) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Reset file status to queued for reprocessing
    const updatedFile = {
      ...file,
      status: 'queued',
      analysisResults: null,
      analysisStarted: null,
      analysisCompleted: null,
      reprocessedAt: new Date().toISOString()
    }

    await kv.set(`file:${fileId}`, updatedFile)

    return c.json({ 
      success: true, 
      message: 'File queued for reprocessing',
      file: updatedFile 
    })
  } catch (error) {
    console.log(`Error reprocessing file: ${error}`)
    return c.json({ error: 'Failed to reprocess file' }, 500)
  }
})

// Save configuration
app.post('/make-server-0fb30735/configuration', async (c) => {
  try {
    const config = await c.req.json()
    const configId = `config:${Date.now()}`
    
    const configData = {
      ...config,
      id: configId,
      savedAt: new Date().toISOString(),
      name: config.name || 'Unnamed Configuration'
    }

    await kv.set(configId, configData)
    return c.json({ success: true, configId, config: configData })
  } catch (error) {
    console.log(`Error saving configuration: ${error}`)
    return c.json({ error: 'Failed to save configuration' }, 500)
  }
})

// Get saved configurations
app.get('/make-server-0fb30735/configurations', async (c) => {
  try {
    const configs = await kv.getByPrefix('config:')
    return c.json({ configurations: configs.reverse() }) // Most recent first
  } catch (error) {
    console.log(`Error fetching configurations: ${error}`)
    return c.json({ error: 'Failed to fetch configurations' }, 500)
  }
})

// Start analysis
app.post('/make-server-0fb30735/analyze', async (c) => {
  try {
    const { fileIds, configuration } = await c.req.json()
    
    if (!fileIds || fileIds.length === 0) {
      return c.json({ error: 'No files provided for analysis' }, 400)
    }

    // Update file statuses to 'analyzing'
    for (const fileId of fileIds) {
      const file = await kv.get(`file:${fileId}`)
      if (file) {
        await kv.set(`file:${fileId}`, {
          ...file,
          status: 'analyzing',
          analysisStarted: new Date().toISOString(),
          configuration
        })
      }
    }

    // Create analysis job
    const jobId = `job:${Date.now()}`
    const analysisJob = {
      id: jobId,
      fileIds,
      configuration,
      status: 'running',
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    }

    await kv.set(jobId, analysisJob)

    // Simulate analysis completion after a delay
    setTimeout(async () => {
      try {
        // Update files to 'complete' status
        for (const fileId of fileIds) {
          const file = await kv.get(`file:${fileId}`)
          if (file) {
            await kv.set(`file:${fileId}`, {
              ...file,
              status: 'complete',
              analysisCompleted: new Date().toISOString(),
              analysisResults: {
                topics: Math.floor(Math.random() * 10) + 5,
                entities: Math.floor(Math.random() * 50) + 20,
                confidence: 0.85 + Math.random() * 0.1
              }
            })
          }
        }

        // Update job status
        await kv.set(jobId, {
          ...analysisJob,
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      } catch (error) {
        console.log(`Error completing analysis simulation: ${error}`)
      }
    }, 10000) // Complete after 10 seconds for demo

    return c.json({ 
      success: true, 
      jobId,
      message: 'Analysis started successfully',
      estimatedCompletion: analysisJob.estimatedCompletion
    })

  } catch (error) {
    console.log(`Error starting analysis: ${error}`)
    return c.json({ error: 'Failed to start analysis' }, 500)
  }
})

// Get analysis status
app.get('/make-server-0fb30735/analysis/:jobId', async (c) => {
  try {
    const jobId = c.req.param('jobId')
    const job = await kv.get(`job:${jobId}`)
    
    if (!job) {
      return c.json({ error: 'Analysis job not found' }, 404)
    }

    return c.json({ job })
  } catch (error) {
    console.log(`Error fetching analysis status: ${error}`)
    return c.json({ error: 'Failed to fetch analysis status' }, 500)
  }
})

Deno.serve(app.fetch)