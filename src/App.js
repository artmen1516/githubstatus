import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChartJS from 'chart.js/auto';
import {LinearScale, PointElement, Tooltip, Legend, TimeScale} from "chart.js";
import { Bar } from 'react-chartjs-2';
import adapter from 'chartjs-adapter-moment';
import moment from 'moment';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, TimeScale);

const baseURL = 'https://www.githubstatus.com/history.atom';

export default function App() {
  const [incidentData, setIncidentData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(baseURL);
        const parser = new DOMParser();
        const xml = parser.parseFromString(response.data, 'application/xml');
        const entries = xml.getElementsByTagName('entry');
        const incidents = [];

        // Calculate start date for the last month
        const startDate = moment().subtract(1, 'month').startOf('month');


        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];

          // Get title, updated time, and content of incident
          const title = entry.getElementsByTagName('title')[0].textContent;
          const updated = entry.getElementsByTagName('updated')[0].textContent;
          const content = entry.getElementsByTagName('content')[0].textContent;

          // Get date of incident from updated time
          const date = moment(updated).format('MMM DD, YYYY');

          // Get starting time and ending time of incident from content
          const timeRangeRegex = /(\d{1,2}:\d{2})(?=.*?var data-var='time'>(\d{1,2}:\d{2}))/g;
          const timeRangeMatches = Array.from(content.matchAll(timeRangeRegex));
          const startTime = timeRangeMatches.length > 1 ? timeRangeMatches[1][1] : 'N/A';
          const endTime = timeRangeMatches.length > 0 ? timeRangeMatches[0][1] : 'N/A';
          const timeRange = `${startTime} - ${endTime}`;

          // Array of services that failed during incident
          if (moment(updated).isAfter(startDate)) {
            incidents.push({
              title,
              updated,
              date,
              timeRange,
            });
          }
        }

        setIncidentData(incidents);
      } catch (error) {
        console.log('Error fetching GitHub status:', error);
      }
    };

    fetchData();
  }, []);

// Set current status of GitHub, if there is an incident in the last hour, GitHub is experiencing issues
const currentStatus = incidentData.some((incident) => moment(incident.updated).isAfter(moment().subtract(1, 'hour')))
  ? 'Experiencing issues ⚠️'
  : 'All Systems Operational';

// Change background color of text currentStatus based on current status
const currentStatusColor = incidentData.some((incident) => moment(incident.updated).isAfter(moment().subtract(1, 'hour')))
  ? 'bg-red-500'
  : 'bg-green-500';

// Count number of incidents per day
const incidentCountByDate = {};
incidentData.forEach((incident) => {
  const { date } = incident;
  incidentCountByDate[date] = incidentCountByDate[date] ? incidentCountByDate[date] + 1 : 1;
});

// Graph data using chart.js
const chartData = {
  labels: Object.keys(incidentCountByDate),
  datasets: [
    {
      label: 'Count',
      data: incidentData.map((incident) => ({
        x: incident.date,
        y: incidentCountByDate[incident.date],
      })),
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderColor: 'rgba(255, 99, 132, 1)',
    },
  ],
};

const chartOptions = {
  scales: {
    x: {
      type: 'time',
      adapters: {
        date: {
          locale: 'en',
        },
      },
      time: {
        unit: 'day',
        displayFormats: {
          day: 'MMM D',
        },
      },
      title: {
        display: true,
        text: 'Date',
      },
    },
    y: {
      title: {
        display: true,
        text: 'Incidents',
      },
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (context) =>
          `${incidentData[context.dataIndex].timeRange}, ${incidentData[context.dataIndex].title}`,
      },
    },
  },
};

  return (
    <div className='flex h-screen flex-col m-0 p-0 items-center'>
      <div className='flex flex-col w-full'>
        <h1 className='w-full  text-3xl text-center px-4 py-3 border-b border-slate-200 shadow-lg'>GitHub Status</h1> 
        <p className='text-center mt-6'><span className={currentStatusColor +' rounded-xl p-2 font-bold text-white'}>{currentStatus}</span></p>
        <p className='text-center mt-6'>Incidents in the last month</p>
      </div>
      <div className='w-full flex flex-1 h-[calc(100vh-210px)] justify-center px-6'>
        <Bar data={chartData} options={chartOptions}/>
      </div>
      <div className='flex flex-col w-full'>
        <p className='w-full text-center px-4 py-3 border-t border-slate-200'>Data from <a href='https://www.githubstatus.com/' className='text-blue-500'>GitHub Status</a>, created by <a href='https://www.github.com/artmen1516' className='text-blue-500'> Artmen1516</a>  </p>
      </div>
    </div>
  );
};

