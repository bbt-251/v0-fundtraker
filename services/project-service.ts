import { db, storage } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"
import type {
  Project,
  ProjectApprovalStatus,
  ProjectDocument,
  HumanResource,
  MaterialResource,
  FundAccount,
  ProjectActivity,
  ProjectTask,
  TaskResourceAssignment,
  ProjectDeliverable,
  ProjectMilestone,
  DecisionGate,
  ProjectRisk,
  CommunicationPlan,
  SocialMediaAccount,
  CommunicationMedium,
  FundReleaseRequest,
  ScheduledTransfer,
} from "@/types/project"
import { auth } from "@/lib/firebase/firebase"
import type { MilestoneBudget } from "@/components/financial-resource-tab"

// Collection reference
const projectsCollection = collection(db, "projects")

// Get projects by owner ID
export async function getProjects(userId: string): Promise<Project[]> {
  try {
    const projectsRef = collection(db, "projects")
    const q = query(projectsRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  } catch (error) {
    console.error("Error getting projects:", error)
    throw new Error("Failed to fetch projects")
  }
}

// Get projects created by a user (alias for getProjects for clarity)
export async function getUserProjects(userId: string): Promise<Project[]> {
  if (!userId) {
    return []
  }
  return getProjects(userId)
}

// Get project by ID
export async function getProject(id: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, "projects", id)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const data = projectSnap.data()
      // Ensure all document URLs are valid
      const documents = data.documents || []
      const validatedDocuments = documents.map((doc) => ({
        ...doc,
        // Ensure URL is a string and not a blob URL that might cause issues
        url: typeof doc.url === "string" ? doc.url : "",
      }))

      return {
        id: projectSnap.id,
        ...data,
        documents: validatedDocuments,
      } as Project
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting project:", error)
    throw new Error("Failed to fetch project")
  }
}

// Alias for getProject to maintain backward compatibility
export async function getProjectById(id: string): Promise<Project | null> {
  return getProject(id)
}

// Create a new project
export async function createProject(project: Omit<Project, "id">): Promise<Project> {
  try {
    const docRef = await addDoc(projectsCollection, {
      ...project,
      createdAt: serverTimestamp(),
    })
    const docSnap = await getDoc(docRef)
    return { id: docSnap.id, ...docSnap.data() } as Project
  } catch (error) {
    console.error("Error creating project:", error)
    throw new Error("Failed to create project")
  }
}

// Update an existing project
export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  try {
    const projectRef = doc(db, "projects", id)
    await updateDoc(projectRef, updates)
  } catch (error) {
    console.error("Error updating project:", error)
    throw new Error("Failed to update project")
  }
}

// Delete a project
export async function deleteProject(id: string): Promise<void> {
  try {
    const projectRef = doc(db, "projects", id)
    await deleteDoc(projectRef)
  } catch (error) {
    console.error("Error deleting project:", error)
    throw new Error("Failed to delete project")
  }
}

// Update project status
export async function updateProjectStatus(
  projectId: string,
  isAnnouncedToDonors: boolean,
  isInExecution: boolean,
): Promise<void> {
  try {
    const projectRef = doc(db, "projects", projectId)
    await updateDoc(projectRef, { isAnnouncedToDonors, isInExecution })
  } catch (error) {
    console.error("Error updating project status:", error)
    throw new Error("Failed to update project status")
  }
}

// Get all announced projects
export async function getAnnouncedProjects(): Promise<Project[]> {
  try {
    const q = query(projectsCollection, where("isAnnouncedToDonors", "==", true))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  } catch (error) {
    console.error("Error getting announced projects:", error)
    throw new Error("Failed to fetch announced projects")
  }
}

// Get projects awaiting approval
export async function getProjectsAwaitingApproval(): Promise<Project[]> {
  try {
    const q = query(projectsCollection, where("approvalStatus", "==", "pending"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  } catch (error) {
    console.error("Error getting projects awaiting approval:", error)
    throw new Error("Failed to fetch projects awaiting approval")
  }
}

// Update project approval status
export async function updateProjectApprovalStatus(
  projectId: string,
  approvalStatus: ProjectApprovalStatus,
  rejectionReason?: string,
): Promise<void> {
  try {
    const projectRef = doc(db, "projects", projectId)
    await updateDoc(projectRef, { approvalStatus, rejectionReason })
  } catch (error) {
    console.error("Error updating project approval status:", error)
    throw new Error("Failed to update project approval status")
  }
}

// Get all projects for platform governor
export async function getProjectsForGovernor(): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(projectsCollection)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  } catch (error) {
    console.error("Error getting all projects for governor:", error)
    throw new Error("Failed to fetch all projects for governor")
  }
}

// Function to update the project cost
export const updateProjectCost = async (projectId: string, cost: number): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    await updateDoc(projectRef, { cost })
  } catch (error) {
    console.error("Error updating project cost:", error)
    throw error
  }
}

// Function to upload a project document to Firebase Storage
export async function uploadProjectDocument(
  projectId: string,
  file: File,
  type: "business" | "tax" | "additional",
): Promise<ProjectDocument> {
  try {
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

    // Create the document object
    const document: ProjectDocument = {
      id: documentId,
      name: file.name,
      type,
      url: downloadUrl,
      uploadedAt: new Date().toISOString(),
    }

    // Add the document to the project's documents array
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const documents = projectData.documents || []

      // Add the new document
      const updatedDocuments = [...documents, document]

      // Update the project
      await updateDoc(projectRef, { documents: updatedDocuments })

      return document
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error uploading project document:", error)
    throw error
  }
}

// Function to delete a project document
export async function deleteProjectDocument(projectId: string, documentId: string): Promise<void> {
  try {
    // Get the project document
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const documents = projectData.documents || []

      // Remove the document from the project's documents array
      const updatedDocuments = documents.filter((doc) => doc.id !== documentId)

      // Update the project
      await updateDoc(projectRef, { documents: updatedDocuments })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting project document:", error)
    throw error
  }
}

// Function to add a new human resource
export const addHumanResource = async (
  projectId: string,
  resource: Omit<HumanResource, "id">,
): Promise<HumanResource> => {
  try {
    const resourceId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const resources = projectData.humanResources || []

      const newResource = { id: resourceId, ...resource }
      const updatedResources = [...resources, newResource]

      await updateDoc(projectRef, { humanResources: updatedResources })
      return newResource
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding human resource:", error)
    throw error
  }
}

// Function to update an existing human resource
export const updateHumanResource = async (
  projectId: string,
  resourceId: string,
  updates: Partial<HumanResource>,
): Promise<HumanResource> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const resources = projectData.humanResources || []

      const updatedResources = resources.map((resource) =>
        resource.id === resourceId ? { ...resource, ...updates } : resource,
      )

      await updateDoc(projectRef, { humanResources: updatedResources })
      return updatedResources.find((resource) => resource.id === resourceId) as HumanResource
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating human resource:", error)
    throw error
  }
}

// Function to delete a human resource
export const deleteHumanResource = async (projectId: string, resourceId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const resources = projectData.humanResources || []

      const updatedResources = resources.filter((resource) => resource.id !== resourceId)

      await updateDoc(projectRef, { humanResources: updatedResources })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting human resource:", error)
    throw error
  }
}

// Function to add a new material resource
export const addMaterialResource = async (
  projectId: string,
  resource: Omit<MaterialResource, "id">,
): Promise<MaterialResource> => {
  try {
    const resourceId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const resources = projectData.materialResources || []

      const newResource = { id: resourceId, ...resource }
      const updatedResources = [...resources, newResource]

      await updateDoc(projectRef, { materialResources: updatedResources })
      return newResource
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding material resource:", error)
    throw error
  }
}

// Function to update an existing material resource
export const updateMaterialResource = async (
  projectId: string,
  resourceId: string,
  updates: Partial<MaterialResource>,
): Promise<MaterialResource> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const resources = projectData.materialResources || []

      const updatedResources = resources.map((resource) =>
        resource.id === resourceId ? { ...resource, ...updates } : resource,
      )

      await updateDoc(projectRef, { materialResources: updatedResources })
      return updatedResources.find((resource) => resource.id === resourceId) as MaterialResource
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating material resource:", error)
    throw error
  }
}

// Function to delete a material resource
export const deleteMaterialResource = async (projectId: string, resourceId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const resources = projectData.materialResources || []

      const updatedResources = resources.filter((resource) => resource.id !== resourceId)

      await updateDoc(projectRef, { materialResources: updatedResources })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting material resource:", error)
    throw error
  }
}

// Function to add a new fund account
export const addFundAccount = async (
  projectId: string,
  account: Omit<FundAccount, "id" | "createdAt">,
): Promise<FundAccount> => {
  try {
    const accountId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const accounts = projectData.fundAccounts || []

      const newAccount = { id: accountId, ...account, createdAt: new Date().toISOString() }
      const updatedAccounts = [...accounts, newAccount]

      await updateDoc(projectRef, { fundAccounts: updatedAccounts })
      return newAccount
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding fund account:", error)
    throw error
  }
}

// Function to update an existing fund account
export const updateFundAccount = async (
  projectId: string,
  accountId: string,
  updates: Partial<FundAccount>,
): Promise<FundAccount> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const accounts = projectData.fundAccounts || []

      const updatedAccounts = accounts.map((account) =>
        account.id === accountId ? { ...account, ...updates } : account,
      )

      await updateDoc(projectRef, { fundAccounts: updatedAccounts })
      return updatedAccounts.find((account) => account.id === accountId) as FundAccount
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating fund account:", error)
    throw error
  }
}

// Function to delete a fund account
export const deleteFundAccount = async (projectId: string, accountId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const accounts = projectData.fundAccounts || []

      const updatedAccounts = accounts.filter((account) => account.id !== accountId)

      await updateDoc(projectRef, { fundAccounts: updatedAccounts })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting fund account:", error)
    throw error
  }
}

// Function to add a new project activity
export const addProjectActivity = async (
  projectId: string,
  activity: Omit<ProjectActivity, "id" | "createdAt">,
): Promise<ProjectActivity> => {
  try {
    const activityId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const activities = projectData.activities || []

      const newActivity = { id: activityId, ...activity, createdAt: new Date().toISOString() }
      const updatedActivities = [...activities, newActivity]

      await updateDoc(projectRef, { activities: updatedActivities })
      return newActivity
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding project activity:", error)
    throw error
  }
}

// Function to update an existing project activity
export const updateProjectActivity = async (
  projectId: string,
  activityId: string,
  updates: Partial<ProjectActivity>,
): Promise<ProjectActivity> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const activities = projectData.activities || []

      const updatedActivities = activities.map((activity) =>
        activity.id === activityId ? { ...activity, ...updates } : activity,
      )

      await updateDoc(projectRef, { activities: updatedActivities })
      return updatedActivities.find((activity) => activity.id === activityId) as ProjectActivity
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating project activity:", error)
    throw error
  }
}

// Function to delete a project activity
export const deleteProjectActivity = async (projectId: string, activityId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const activities = projectData.activities || []

      const updatedActivities = activities.filter((activity) => activity.id !== activityId)

      await updateDoc(projectRef, { activities: updatedActivities })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting project activity:", error)
    throw error
  }
}

// Function to get all activities for a project
export async function getProjectActivities(projectId: string): Promise<ProjectActivity[]> {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      return projectData.activities || []
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error getting project activities:", error)
    throw new Error("Failed to fetch project activities")
  }
}

// Function to add a new project task
export const addProjectTask = async (
  projectId: string,
  task: Omit<ProjectTask, "id" | "resources">,
): Promise<ProjectTask> => {
  try {
    const taskId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const tasks = projectData.tasks || []

      // Ensure required fields have default values
      const newTask = {
        id: taskId,
        resources: [],
        status: task.status || "Not Started",
        priority: task.priority || "Medium",
        ...task,
      }

      // Filter out any undefined values
      const filteredTask = Object.fromEntries(
        Object.entries(newTask).filter(([_, value]) => value !== undefined),
      ) as ProjectTask

      const updatedTasks = [...tasks, filteredTask]

      await updateDoc(projectRef, { tasks: updatedTasks })
      return filteredTask
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding project task:", error)
    throw error
  }
}

// Function to update an existing project task
export const updateProjectTask = async (
  projectId: string,
  taskId: string,
  updates: Partial<ProjectTask>,
): Promise<ProjectTask> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const tasks = projectData.tasks || []

      // Filter out any undefined values from the updates object
      const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined))

      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...filteredUpdates } : task))

      await updateDoc(projectRef, { tasks: updatedTasks })
      return updatedTasks.find((task) => task.id === taskId) as ProjectTask
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating project task:", error)
    throw error
  }
}

// Function to delete a project task
export const deleteProjectTask = async (projectId: string, taskId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const tasks = projectData.tasks || []

      const updatedTasks = tasks.filter((task) => task.id !== taskId)

      await updateDoc(projectRef, { tasks: updatedTasks })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting project task:", error)
    throw error
  }
}

// Function to add a resource assignment to a task
export const addTaskResourceAssignment = async (
  projectId: string,
  taskId: string,
  assignment: Omit<TaskResourceAssignment, "id">,
): Promise<TaskResourceAssignment> => {
  try {
    const assignmentId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const tasks = projectData.tasks || []

      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          const newAssignment = { id: assignmentId, ...assignment }
          return { ...task, resources: [...task.resources, newAssignment] }
        }
        return task
      })

      await updateDoc(projectRef, { tasks: updatedTasks })
      return { id: assignmentId, ...assignment }
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding task resource assignment:", error)
    throw error
  }
}

// Function to delete a resource assignment from a task
export const deleteTaskResourceAssignment = async (
  projectId: string,
  taskId: string,
  assignmentId: string,
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const tasks = projectData.tasks || []

      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            resources: task.resources.filter((resource) => resource.id !== assignmentId),
          }
        }
        return task
      })

      await updateDoc(projectRef, { tasks: updatedTasks })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting task resource assignment:", error)
    throw error
  }
}

// Function to add a new project deliverable
export const addProjectDeliverable = async (
  projectId: string,
  deliverable: Omit<ProjectDeliverable, "id" | "createdAt">,
): Promise<ProjectDeliverable> => {
  try {
    const deliverableId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const deliverables = projectData.deliverables || []

      const newDeliverable = { id: deliverableId, ...deliverable, createdAt: new Date().toISOString() }
      const updatedDeliverables = [...deliverables, newDeliverable]

      await updateDoc(projectRef, { deliverables: updatedDeliverables })
      return newDeliverable
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding project deliverable:", error)
    throw error
  }
}

// Function to update an existing project deliverable
export const updateProjectDeliverable = async (
  projectId: string,
  deliverableId: string,
  updates: Partial<ProjectDeliverable>,
): Promise<ProjectDeliverable> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const deliverables = projectData.deliverables || []

      const updatedDeliverables = deliverables.map((deliverable) =>
        deliverable.id === deliverableId ? { ...deliverable, ...updates } : deliverable,
      )

      await updateDoc(projectRef, { deliverables: updatedDeliverables })
      return updatedDeliverables.find((deliverable) => deliverable.id === deliverableId) as ProjectDeliverable
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating project deliverable:", error)
    throw error
  }
}

// Function to delete a project deliverable
export const deleteProjectDeliverable = async (projectId: string, deliverableId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const deliverables = projectData.deliverables || []

      const updatedDeliverables = deliverables.filter((deliverable) => deliverable.id !== deliverableId)

      await updateDoc(projectRef, { deliverables: updatedDeliverables })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting project deliverable:", error)
    throw error
  }
}

// Function to add a new project milestone
export const addProjectMilestone = async (
  projectId: string,
  milestone: Omit<ProjectMilestone, "id" | "createdAt">,
): Promise<ProjectMilestone> => {
  try {
    const milestoneId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const milestones = projectData.milestones || []

      const newMilestone = { id: milestoneId, ...milestone, createdAt: new Date().toISOString() }
      const updatedMilestones = [...milestones, newMilestone]

      await updateDoc(projectRef, { milestones: updatedMilestones })
      return newMilestone
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding project milestone:", error)
    throw error
  }
}

// Function to update an existing project milestone
export const updateProjectMilestone = async (
  projectId: string,
  milestoneId: string,
  updates: Partial<ProjectMilestone>,
): Promise<ProjectMilestone> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const milestones = projectData.milestones || []

      const updatedMilestones = milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      )

      await updateDoc(projectRef, { milestones: updatedMilestones })
      return updatedMilestones.find((milestone) => milestone.id === milestoneId) as ProjectMilestone
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating project milestone:", error)
    throw error
  }
}

// Function to delete a project milestone
export const deleteProjectMilestone = async (projectId: string, milestoneId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const milestones = projectData.milestones || []

      const updatedMilestones = milestones.filter((milestone) => milestone.id !== milestoneId)

      await updateDoc(projectRef, { milestones: updatedMilestones })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting project milestone:", error)
    throw error
  }
}

// Function to add a new decision gate
export const addDecisionGate = async (
  projectId: string,
  gate: Omit<DecisionGate, "id" | "createdAt" | "status">,
): Promise<DecisionGate> => {
  try {
    const gateId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const decisionGates = projectData.decisionGates || []

      const newGate = { id: gateId, ...gate, createdAt: new Date().toISOString(), status: "Scheduled" }
      const updatedDecisionGates = [...decisionGates, newGate]

      await updateDoc(projectRef, { decisionGates: updatedDecisionGates })
      return newGate
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding decision gate:", error)
    throw error
  }
}

// Function to update an existing decision gate
export const updateDecisionGate = async (
  projectId: string,
  gateId: string,
  updates: Partial<DecisionGate>,
): Promise<DecisionGate> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const decisionGates = projectData.decisionGates || []

      const updatedDecisionGates = decisionGates.map((gate) => (gate.id === gateId ? { ...gate, ...updates } : gate))

      await updateDoc(projectRef, { decisionGates: updatedDecisionGates })
      return updatedDecisionGates.find((gate) => gate.id === gateId) as DecisionGate
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating decision gate:", error)
    throw error
  }
}

// Function to delete a decision gate
export const deleteDecisionGate = async (projectId: string, gateId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const decisionGates = projectData.decisionGates || []

      const updatedDecisionGates = decisionGates.filter((gate) => gate.id !== gateId)

      await updateDoc(projectRef, { decisionGates: updatedDecisionGates })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting decision gate:", error)
    throw error
  }
}

// Function to add a new project risk
export const addProjectRisk = async (
  projectId: string,
  risk: Omit<ProjectRisk, "id" | "riskScore" | "createdAt" | "updatedAt">,
): Promise<ProjectRisk> => {
  try {
    const riskId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const risks = projectData.risks || []

      const newRisk = {
        id: riskId,
        riskScore: risk.impact * risk.probability,
        ...risk,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updatedRisks = [...risks, newRisk]

      await updateDoc(projectRef, { risks: updatedRisks })
      return newRisk
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding project risk:", error)
    throw error
  }
}

// Function to delete a project risk
export const deleteProjectRisk = async (projectId: string, riskId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const risks = projectData.risks || []

      const updatedRisks = risks.filter((risk) => risk.id !== riskId)

      await updateDoc(projectRef, { risks: updatedRisks })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting project risk:", error)
    throw error
  }
}

// Function to get the communication plan
export const getCommunicationPlan = async (projectId: string): Promise<CommunicationPlan | null> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      return projectData.communicationPlan || null
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error getting communication plan:", error)
    throw error
  }
}

// Function to update the communication plan
export const updateCommunicationPlan = async (projectId: string, plan: CommunicationPlan): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    await updateDoc(projectRef, { communicationPlan: plan })
  } catch (error) {
    console.error("Error updating communication plan:", error)
    throw error
  }
}

// Function to add a new social media account
export const addSocialMediaAccount = async (
  projectId: string,
  account: Omit<SocialMediaAccount, "id">,
): Promise<SocialMediaAccount> => {
  try {
    const accountId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const accounts = projectData.socialMediaAccounts || []

      const newAccount = { id: accountId, ...account }
      const updatedAccounts = [...accounts, newAccount]

      await updateDoc(projectRef, { socialMediaAccounts: updatedAccounts })
      return newAccount
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding social media account:", error)
    throw error
  }
}

// Function to delete a social media account
export const deleteSocialMediaAccount = async (projectId: string, accountId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const accounts = projectData.socialMediaAccounts || []

      const updatedAccounts = accounts.filter((account) => account.id !== accountId)

      await updateDoc(projectRef, { socialMediaAccounts: updatedAccounts })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting social media account:", error)
    throw error
  }
}

// Function to add a new communication medium
export const addCommunicationMedium = async (
  projectId: string,
  medium: Omit<CommunicationMedium, "id">,
): Promise<CommunicationMedium> => {
  try {
    const mediumId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const mediums = projectData.communicationMediums || []

      const newMedium = { id: mediumId, ...medium }
      const updatedMediums = [...mediums, newMedium]

      await updateDoc(projectRef, { communicationMediums: updatedMediums })
      return newMedium
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding communication medium:", error)
    throw error
  }
}

// Function to delete a communication medium
export const deleteCommunicationMedium = async (projectId: string, mediumId: string): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const mediums = projectData.communicationMediums || []

      const updatedMediums = mediums.filter((medium) => medium.id !== mediumId)

      await updateDoc(projectRef, { communicationMediums: updatedMediums })
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error deleting communication medium:", error)
    throw error
  }
}

// Function to get multiple projects by their IDs
export async function getProjectsByIds(projectIds: string[]): Promise<Project[]> {
  try {
    const projects: Project[] = []

    // Iterate through the projectIds array
    for (const projectId of projectIds) {
      const project = await getProject(projectId)
      if (project) {
        projects.push(project)
      }
    }

    return projects
  } catch (error) {
    console.error("Error getting projects by IDs:", error)
    return []
  }
}

// Function to submit a fund release request
export const submitFundReleaseRequest = async (
  projectId: string,
  milestoneId: string,
  amount: number,
  description: string,
): Promise<FundReleaseRequest> => {
  try {
    const requestId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const fundReleaseRequests = projectData.fundReleaseRequests || []

      const newRequest: FundReleaseRequest = {
        id: requestId,
        projectId,
        milestoneId,
        amount,
        description,
        status: "Pending",
        requestedBy: auth.currentUser?.uid || "",
        requestedByName: auth.currentUser?.displayName || "Project Manager",
        requestDate: new Date().toISOString(),
      }

      const updatedRequests = [...fundReleaseRequests, newRequest]

      await updateDoc(projectRef, { fundReleaseRequests: updatedRequests })
      return newRequest
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error submitting fund release request:", error)
    throw error
  }
}

// Function to get fund release requests for a project
export const getFundReleaseRequests = async (projectId: string): Promise<FundReleaseRequest[]> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      return projectData.fundReleaseRequests || []
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error getting fund release requests:", error)
    throw error
  }
}

// Function to get projects managed by a specific user
export const getProjectsByManager = async (managerId: string): Promise<Project[]> {
  try {
    const projectsRef = collection(db, "projects")
    const q = query(projectsRef, where("projectManagerId", "==", managerId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  } catch (error) {
    console.error("Error getting projects by manager:", error)
    throw error
  }
}

// Function to get projects owned by a specific user
export const getProjectsByOwner = async (ownerId: string): Promise<Project[]> {
  try {
    const projectsRef = collection(db, "projects")
    const q = query(projectsRef, where("userId", "==", ownerId))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[]
  } catch (error) {
    console.error("Error getting projects by owner:", error)
    throw error
  }
}

// Function to add a new milestone budget
export const addMilestoneBudget = async (
  projectId: string,
  budget: Omit<MilestoneBudget, "id">,
): Promise<MilestoneBudget> => {
  try {
    const budgetId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const budgets = projectData.milestoneBudgets || []

      const newBudget = { id: budgetId, ...budget }
      const updatedBudgets = [...budgets, newBudget]

      await updateDoc(projectRef, { milestoneBudgets: updatedBudgets })
      return newBudget
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error adding milestone budget:", error)
    throw error
  }
}

// Function to update an existing milestone budget
export const updateMilestoneBudget = async (
  projectId: string,
  updates: Partial<MilestoneBudget> & { id: string },
): Promise<MilestoneBudget> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const budgets = projectData.milestoneBudgets || []

      const updatedBudgets = budgets.map((budget) => (budget.id === updates.id ? { ...budget, ...updates } : budget))

      await updateDoc(projectRef, { milestoneBudgets: updatedBudgets })
      return updatedBudgets.find((budget) => budget.id === updates.id) as MilestoneBudget
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating milestone budget:", error)
    throw error
  }
}

// Function to create a scheduled transfer when a fund release request is approved
export const createScheduledTransfer = async (
  projectId: string,
  fundReleaseRequestId: string,
  recipientId: string,
): Promise<ScheduledTransfer> => {
  try {
    const transferId = uuidv4()
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      throw new Error("Project not found")
    }

    const projectData = projectSnap.data() as Project

    // Find the fund release request
    const fundReleaseRequest = projectData.fundReleaseRequests?.find((request) => request.id === fundReleaseRequestId)

    if (!fundReleaseRequest) {
      throw new Error("Fund release request not found")
    }

    // Find the milestone
    const milestone = projectData.milestones?.find((m) => m.id === fundReleaseRequest.milestoneId)

    if (!milestone) {
      throw new Error("Milestone not found")
    }

    // Find the recipient (fund account)
    const fundAccount = projectData.fundAccounts?.find((a) => a.id === recipientId)

    if (!fundAccount) {
      throw new Error("Fund account not found")
    }

    // Create the scheduled transfer
    const scheduledTransfer: ScheduledTransfer = {
      id: transferId,
      projectId,
      projectName: projectData.name,
      milestoneId: fundReleaseRequest.milestoneId,
      milestoneName: milestone.name,
      fundReleaseRequestId,
      recipientId,
      recipientName: fundAccount.accountOwnerName,
      accountName: fundAccount.accountName,
      accountNumber: fundAccount.accountNumber || "",
      bankName: fundAccount.bankName,
      amount: fundReleaseRequest.amount,
      status: "To be Transferred",
      requestedBy: fundReleaseRequest.requestedBy,
      requestedByName: fundReleaseRequest.requestedByName,
      requestDate: fundReleaseRequest.requestDate,
    }

    // Add the scheduled transfer to the project
    const scheduledTransfers = projectData.scheduledTransfers || []
    const updatedScheduledTransfers = [...scheduledTransfers, scheduledTransfer]

    await updateDoc(projectRef, { scheduledTransfers: updatedScheduledTransfers })

    return scheduledTransfer
  } catch (error) {
    console.error("Error creating scheduled transfer:", error)
    throw error
  }
}

// Function to update a scheduled transfer
export const updateScheduledTransfer = async (
  projectId: string,
  transferId: string,
  updates: Partial<ScheduledTransfer>,
): Promise<ScheduledTransfer> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      throw new Error("Project not found")
    }

    const projectData = projectSnap.data() as Project
    const scheduledTransfers = projectData.scheduledTransfers || []

    const updatedScheduledTransfers = scheduledTransfers.map((transfer) =>
      transfer.id === transferId ? { ...transfer, ...updates } : transfer,
    )

    await updateDoc(projectRef, { scheduledTransfers: updatedScheduledTransfers })

    return updatedScheduledTransfers.find((transfer) => transfer.id === transferId) as ScheduledTransfer
  } catch (error) {
    console.error("Error updating scheduled transfer:", error)
    throw error
  }
}

// Function to get all scheduled transfers
export const getScheduledTransfers = async (): Promise<ScheduledTransfer[]> => {
  try {
    const transfers: ScheduledTransfer[] = []
    const projectsSnapshot = await getDocs(projectsCollection)

    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data() as Project
      if (projectData.scheduledTransfers && projectData.scheduledTransfers.length > 0) {
        transfers.push(...projectData.scheduledTransfers)
      }
    }

    return transfers
  } catch (error) {
    console.error("Error getting scheduled transfers:", error)
    throw error
  }
}
