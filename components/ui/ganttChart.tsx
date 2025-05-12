import React from 'react';
import { Gantt, Task,ViewMode } from '@wamra/gantt-task-react';
import "@wamra/gantt-task-react/dist/style.css";
import dayjs from 'dayjs';
import {useState,useEffect} from 'react';
import { Radio, RadioChangeEvent, Row, Skeleton, Typography } from 'antd';
import { DecisionGate, ProjectActivity, ProjectDeliverable, ProjectTask } from '@/types/project';
import { groupBy } from '@/lib/utils/groupby-utils';

const viewModeOptions = [
    {
        label:'Day',
        value:ViewMode.Day 
    },
    {
        label:'Week',
        value:ViewMode.Week 
    },
    {
       label:'Month',
       value:ViewMode.Month 
    },
    {
        label:'Year',
        value:ViewMode.Year 
    }
];

export const GanttChart = (
    {
        tasks,
        activities,
        deliverables,
        decisionGates,
        chartLoading,
        onElementClick,
        // projectOptions,
        // detailModal
    }:{
        tasks:ProjectTask[],
        activities:ProjectActivity[],
        deliverables:ProjectDeliverable[],
        decisionGates:DecisionGate[],
        chartLoading:boolean,
        onElementClick:any,
        // projectOptions?:any,
        // detailModal?:boolean
    }
) => {

    const [formattedData,setFormattedData] = useState<Task[]>([]);
    const [showTaskList,setShowTaskList] = useState<boolean>(false);
    const [viewMode,setViewMode] = useState<ViewMode.Day|ViewMode.Week|ViewMode.Month|ViewMode.Year>(ViewMode.Day);
    // const [selectedProject,setSelectedProject] = useState<string>('');

    const handleExpanderClick = (task: Task) => {
        setFormattedData(formattedData.map(t => (t.id === task.id ? task : t)));
    };

    useEffect(()=>{
        const sortedTasks:ProjectTask[] = JSON.parse(JSON.stringify(tasks)).sort((a:ProjectTask,b:ProjectTask)=>{
            const startDateA = dayjs(a.startDate,'YYYY-MM-DD')
            const startDateB = dayjs(b.startDate,'YYYY-MM-DD')
            return startDateA.isBefore(startDateB,'day')?-1:1;
        });

        const tasksByActivity = groupBy('activityId',sortedTasks);
        const activityIDKeys = Object.keys(tasksByActivity);
        activityIDKeys.sort((activityID1:string,activityID2:string)=>{
            const earliestTask1:ProjectTask = tasksByActivity[activityID1][0];
            const date1 = dayjs(earliestTask1.startDate,'YYYY-MM-DD');

            const earliestTask2:ProjectTask = tasksByActivity[activityID2][0];
            const date2 = dayjs(earliestTask2.startDate,'YYYY-MM-DD');

            return date1.isBefore(date2,'day')?-1:1
        })
        
        const formattedData: Task[] = [];
        
        // Pushing Activity and Task
        activityIDKeys.map((activityID)=>{
            const activity = activities.find(a=>a.id==activityID);

            // Filtering activity and task by project
            // if(selectedProject == activity?.projectID){
                const tasks:ProjectTask[] = tasksByActivity[activityID]
                const earliestTask:ProjectTask = tasks[0];
                let latestTask:ProjectTask|null = null;

                tasks.map((t)=>{
                    const newEndDate = dayjs(t.endDate,'YYYY-MM-DD');
                    if(latestTask){
                        const oldEndDate = dayjs(latestTask.endDate,'YYYY-MM-DD');

                        if(oldEndDate.isBefore(newEndDate)) latestTask = t;
                    }else{
                        latestTask = t;
                    }
                });

                const from = dayjs(earliestTask.startDate,'YYYY-MM-DD');
                const to = dayjs((latestTask??{} as ProjectTask).endDate,'YYYY-MM-DD');
                // Pushing activity
                formattedData.push({
                    start: from.toDate(),
                    end: to.toDate(),
                    name: activity?.name??'',
                    id: activity?.id??'',
                    type:'project',
                    progress: 100,
                    hideChildren: false,
                });

                // Pushing tasks
                tasks.map((task:ProjectTask)=>{
                    const from = dayjs(task.startDate,'YYYY-MM-DD');
                    const to = dayjs(task.endDate,'YYYY-MM-DD');
                    formattedData.push({
                        start: from.toDate(),
                        end: to.toDate(),
                        name: task.name,
                        id: task.id,
                        type:'task',
                        progress: 100,
                        parent:activityID,
                        styles:{barBackgroundColor:'#2ECC71',barBackgroundSelectedColor:'#2ECC71',barProgressColor:'#2ECC71',barProgressSelectedColor:'#2ECC71'}
                    });
                })
            // }

        });

        // Pushing Deliverable
        deliverables.map((deliverable)=>{
            const from = dayjs(deliverable.deadline,'YYYY-MM-DD');

            const to = dayjs(deliverable.deadline,'YYYY-MM-DD');
            formattedData.push({
                start: from.toDate(),
                end: to.toDate(),
                name: deliverable.name,
                id: deliverable.id,
                type:'milestone',
                progress: 100,
                styles: {milestoneBackgroundColor:'#606C38',milestoneBackgroundSelectedColor:'#606C38'}
            });
        });

        // Pushing Decision Gate
        decisionGates.map((decisionGate)=>{
            const from = dayjs(decisionGate.dateTime,'YYYY-MM-DD');
            const to = dayjs(decisionGate.dateTime,'YYYY-MM-DD');
            formattedData.push({
                start: from.toDate(),
                end: to.toDate(),
                name: decisionGate.name,
                id: decisionGate.id,
                type:'milestone',
                progress: 100,
                styles: {milestoneBackgroundColor:'#BC6C25',milestoneBackgroundSelectedColor:'#BC6C25'}
                // styles: { projectBackgroundColor:'#BC6C25',barBackgroundColor:'#BC6C25',barBackgroundSelectedColor:'#BC6C25' }
            });
        });

        // sorting formatted date based on start date
        formattedData.sort((fd1,fd2)=>{
            const startDate1 = dayjs(fd1.start);
            const startDate2 = dayjs(fd2.start);
            return startDate1.isBefore(startDate2)?-1:1
        });
        setFormattedData(formattedData);

    },[activities, decisionGates, deliverables, tasks])


    
    return(
        <div className='mt-[1rem]'>
            {
                (!chartLoading) && formattedData.length?
                <div>
                    <Row justify='end' align='middle' style={{marginBottom:'1rem',gap:'1rem'}}>
                        <Radio.Group
                            options={viewModeOptions}
                            onChange={({ target: { value } }: RadioChangeEvent)=>setViewMode(value)}
                            value={viewMode}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </Row>
                    <Gantt 
                        key='1'
                        tasks={formattedData}
                        viewMode={viewMode}
                        onClick={onElementClick}
                        
                    />
                </div>
                :chartLoading?
                //Chart Skeleton
                <Row>
                    <Row justify={'end'} style={{paddingRight:'1rem',width:'100%'}}>
                        <Skeleton.Button shape={'round'} active={true}/>
                    </Row>
                    <Skeleton active={true} paragraph={{ rows: 6 }}/>
                </Row>
                :<Row justify={'center'} align={'middle'} style={{height:'10rem'}}>
                    <Typography>No Data</Typography>
                </Row>
            }
        </div>
    );
}

export default GanttChart;
