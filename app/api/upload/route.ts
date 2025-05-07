import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/firebase/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"
import { getCurrentTimestamp } from "@/lib/utils/date-utils"

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase storage is available
    if (!storage) {
      return NextResponse.json(
        { error: "Firebase storage is not initialized. Please try again later." },
        { status: 503 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const type = formData.get("type") as "business" | "tax" | "additional"

    if (!file || !projectId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a unique ID for the document
    const documentId = uuidv4()
    const fileName = `${documentId}-${file.name}`
    const filePath = `projects/${projectId}/${type}/${fileName}`

    // Create a storage reference
    const storageRef = ref(storage, filePath)

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Upload the file
    await uploadBytes(storageRef, bytes, {
      contentType: file.type,
    })

    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef)

    // Return the document info with uploadedAt as formatted timestamp string
    return NextResponse.json({
      id: documentId,
      name: file.name,
      type,
      url: downloadUrl,
      uploadedAt: getCurrentTimestamp(), // Store as formatted timestamp string
    })
  } catch (error: any) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 })
  }
}
