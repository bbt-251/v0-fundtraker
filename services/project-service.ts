"use client"

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
} from "@/types/project"
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

// Get project by ID
export async function getProject(id: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, "projects", id)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      return { id: projectSnap.id, ...projectSnap.data() } as Project
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
      const newTask = { id: taskId, resources: [], ...task }
      const updatedTasks = [...tasks, newTask]

      await updateDoc(projectRef, { tasks: updatedTasks })
      return newTask
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

      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))

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

// Function to get project milestones
export const getMilestones = async (projectId: string): Promise<ProjectMilestone[]> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      return projectData.milestones || []
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error getting project milestones:", error)
    throw error
  }
}

// Function to add a milestone budget
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
      const milestoneBudgets = projectData.milestoneBudgets || []

      const newBudget = { id: budgetId, ...budget }
      const updatedBudgets = [...milestoneBudgets, newBudget]

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

// Function to update a milestone budget
export const updateMilestoneBudget = async (projectId: string, budget: MilestoneBudget): Promise<MilestoneBudget> => {
  try {
    const projectRef = doc(db, "projects", projectId)
    const projectSnap = await getDoc(projectRef)

    if (projectSnap.exists()) {
      const projectData = projectSnap.data() as Project
      const milestoneBudgets = projectData.milestoneBudgets || []

      const updatedBudgets = milestoneBudgets.map((item) => (item.id === budget.id ? budget : item))

      await updateDoc(projectRef, { milestoneBudgets: updatedBudgets })
      return budget
    } else {
      throw new Error("Project not found")
    }
  } catch (error) {
    console.error("Error updating milestone budget:", error)
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
