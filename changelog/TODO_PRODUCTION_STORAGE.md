# TODO: Production File Storage Implementation
Doc-Type: Technical TODO · Priority: HIGH · Est. Time: 2-4 hours

## ⚠️ Critical Issue

**Current State**: File uploads stored in `./uploads` directory on Render
**Problem**: Ephemeral filesystem - files deleted on restart/redeploy
**Impact**: Attachments, vehicle photos, work order documents lost
**Status**: **NOT PRODUCTION READY**

---

## 📋 Implementation Checklist

### Phase 1: Choose Storage Provider (30 min)

#### Option A: AWS S3 (Recommended for scale)
- [ ] Create AWS account
- [ ] Create S3 bucket
- [ ] Configure IAM user with S3 permissions
- [ ] Get credentials (Access Key ID + Secret)
- [ ] Cost: ~$0.02/GB storage + $0.09/GB transfer
- [ ] Setup time: 30 minutes

#### Option B: Cloudinary (Easiest for images)
- [ ] Create Cloudinary account (free tier: 25GB storage)
- [ ] Get API credentials
- [ ] Cost: Free tier → $89/mo (paid)
- [ ] Setup time: 15 minutes

#### Option C: Backblaze B2 (Cheapest)
- [ ] Create Backblaze account
- [ ] Create bucket
- [ ] Get application key
- [ ] Cost: $0.005/GB storage, free egress to Render
- [ ] Setup time: 20 minutes

---

### Phase 2: Backend Implementation (1-2 hours)

#### Step 1: Install Dependencies

```bash
cd backend

# For AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage multer-s3

# For Cloudinary
npm install cloudinary multer-storage-cloudinary

# For Backblaze B2
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
# (B2 is S3-compatible)
```

#### Step 2: Create Storage Service

**File**: `backend/src/services/storage.service.ts`

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME!,
    acl: 'private',
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, `attachments/${uniqueName}`);
    },
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  },
});

export class StorageService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    // Returns S3 URL
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Deletes from S3
  }

  async getSignedUrl(fileUrl: string): Promise<string> {
    // Returns temporary access URL
  }
}
```

#### Step 3: Update Upload Routes

**File**: `backend/src/routes/attachment.routes.ts`

```typescript
import { upload } from '../services/storage.service';

// Before (local storage)
router.post('/upload',
  multer({ dest: './uploads' }).single('file'),
  attachmentController.upload
);

// After (cloud storage)
router.post('/upload',
  upload.single('file'),
  attachmentController.upload
);
```

#### Step 4: Update Environment Variables

**Render Dashboard → Environment Variables:**

```env
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=taller-mecanico-uploads

# OR Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OR Backblaze B2
B2_ENDPOINT=s3.us-west-002.backblazeb2.com
B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET_NAME=taller-uploads
```

---

### Phase 3: Frontend Updates (30 min)

#### Update Upload Component

**File**: `frontend/src/components/FileUpload.tsx`

```typescript
// Add loading states
const [uploading, setUploading] = useState(false);

// Handle upload with progress
const handleUpload = async (file: File) => {
  setUploading(true);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/attachments/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    // data.fileUrl is now S3 URL

  } catch (error) {
    console.error('Upload failed:', error);
  } finally {
    setUploading(false);
  }
};
```

---

### Phase 4: Database Migration (15 min)

#### Update Prisma Schema

**File**: `backend/prisma/schema.prisma`

```prisma
model Attachment {
  id          String   @id @default(uuid())
  workOrderId String
  fileName    String
  fileUrl     String   // Now stores S3/Cloud URL
  fileType    String
  fileSize    Int
  uploadedBy  String
  storageKey  String?  // Add: S3 key for deletion
  createdAt   DateTime @default(now())

  workOrder WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)

  @@index([workOrderId])
  @@index([createdAt])
}
```

#### Create Migration

```bash
cd backend
npx prisma migrate dev --name add_storage_key
npx prisma migrate deploy  # On Render
```

---

### Phase 5: Testing (30 min)

#### Test Checklist

- [ ] Upload file (< 10MB)
- [ ] Verify file appears in S3 bucket
- [ ] Download file via signed URL
- [ ] Delete file
- [ ] Verify file removed from S3
- [ ] Upload large file (should fail gracefully)
- [ ] Test concurrent uploads (multiple users)
- [ ] Test file types: PDF, images, documents

---

### Phase 6: Migration Plan (if existing data)

If you already have files in `./uploads`:

```bash
# 1. Create migration script
# backend/scripts/migrate-to-s3.ts

import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../src/lib/prisma';

async function migrateFiles() {
  const uploadsDir = './uploads';
  const files = fs.readdirSync(uploadsDir);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileContent = fs.readFileSync(filePath);

    // Upload to S3
    const s3Key = `migrated/${file}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
    }));

    // Update database
    await prisma.attachment.updateMany({
      where: { fileName: file },
      data: {
        fileUrl: `https://${bucket}.s3.amazonaws.com/${s3Key}`,
        storageKey: s3Key,
      },
    });
  }
}

# 2. Run migration
npx ts-node scripts/migrate-to-s3.ts
```

---

## 💰 Cost Estimates

### AWS S3 (Recommended)
- Storage: $0.023/GB/month
- Requests: $0.005 per 1,000 PUT, $0.0004 per 1,000 GET
- Transfer: $0.09/GB (first 10TB)
- **Estimated**: $2-5/month for 100GB, 10K requests

### Cloudinary
- Free: 25GB storage, 25GB bandwidth
- Paid: $89/month for 150GB storage
- **Estimated**: Free tier OK for MVP, $89/mo for growth

### Backblaze B2
- Storage: $0.005/GB/month
- Requests: Free egress to Render
- Transfer: First 1GB/day free, then $0.01/GB
- **Estimated**: $0.50-2/month for 100GB

---

## 🔒 Security Considerations

- [ ] Use pre-signed URLs for downloads (temporary access)
- [ ] Validate file types before upload
- [ ] Scan uploads for malware (ClamAV integration)
- [ ] Set CORS policies on bucket
- [ ] Encrypt files at rest (S3 encryption)
- [ ] Implement access logging
- [ ] Set lifecycle policies (delete old files)

---

## 📚 Documentation Updates Needed

After implementation:

- [ ] Update API documentation with new upload endpoints
- [ ] Document signed URL generation process
- [ ] Add troubleshooting guide for upload failures
- [ ] Update deployment guide with storage setup
- [ ] Create runbook for storage monitoring

---

## 🚀 Deployment Steps

1. **Choose provider** (AWS S3 recommended)
2. **Implement backend changes** (~2 hours)
3. **Test locally** with storage credentials
4. **Update Render environment variables**
5. **Deploy backend**
6. **Test uploads** in production
7. **Migrate existing files** (if any)
8. **Remove `./uploads` volume** from config
9. **Monitor costs** in first month

---

## ⏱️ Time Estimate

- **Setup cloud storage**: 30 minutes
- **Backend implementation**: 2 hours
- **Frontend updates**: 30 minutes
- **Database migration**: 15 minutes
- **Testing**: 30 minutes
- **Deployment**: 15 minutes
- **Total**: **4 hours**

---

## 🎯 Success Criteria

- ✅ Files persist across backend restarts
- ✅ Download URLs work from any device
- ✅ Old local uploads migrated (if applicable)
- ✅ Upload failures handled gracefully
- ✅ Costs under $5/month for MVP usage
- ✅ Zero data loss on redeploy

---

## 📞 Need Help?

**AWS S3 Documentation**: https://docs.aws.amazon.com/s3/
**Cloudinary Node.js**: https://cloudinary.com/documentation/node_integration
**Backblaze B2**: https://www.backblaze.com/b2/docs/

---

**Priority**: 🔴 **HIGH** (before production launch)
**Status**: ⏳ **PENDING**
**Assigned To**: Backend Team
**Due Date**: Before production launch
**Estimated Cost**: $2-5/month (AWS S3)
**Estimated Time**: 4 hours implementation
