export const tasksTemplate = [
    {
        title: "Task 1",
        description: "This is the first task",
        status: "Not Started",
        priority: "High",
        assignedTo: "john.doe@example.com", // Use email or unique identifier for the user
        activityId: "activity1",
        startDate: "2025-05-01",
        endDate: "2025-05-10",
        duration: 10,
        multipleRanges: true,
        dateRanges: [
            { startDate: "2025-05-01", endDate: "2025-05-05" },
            { startDate: "2025-05-06", endDate: "2025-05-10" },
        ],
    },
    {
        title: "Task 2",
        description: "This is the second task",
        status: "In Progress",
        priority: "Medium",
        assignedTo: "jane.smith@example.com",
        activityId: "activity2",
        startDate: "2025-05-11",
        endDate: "2025-05-20",
        duration: 9,
        multipleRanges: false,
        dateRanges: [],
    },
];