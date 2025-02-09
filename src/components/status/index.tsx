  import React from 'react';
  import { Line, Pie, Bar } from 'react-chartjs-2';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
  } from 'chart.js';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement
  );

  interface ContentProps {
    title: string;
  }

  export function Status(props: ContentProps) {
    const patientData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Patients',
          data: [65, 80, 120, 90, 110, 120],
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1,
        },
      ],
    };

    const mealData = {
      labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
      datasets: [
        {
          data: [100, 150, 80, 20],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
          ],
        },
      ],
    };

    const staffData = {
      labels: ['Doctors', 'Nurses', 'Kitchen', 'Admin'],
      datasets: [
        {
          label: 'Staff Distribution',
          data: [4, 8, 5, 3],
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
        },
      ],
    };

    const foodSafetyData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Food Safety Score',
          data: [95, 92, 96, 94, 98, 95],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.1,
        },
        {
          label: 'Hygiene Rating',
          data: [90, 88, 92, 91, 94, 93],
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.5)',
          tension: 0.1,
        }
      ],
    };

    const healthMetricsData = {
      labels: ['Health Checkups', 'Vaccinations', 'First Aid Cases', 'Food Safety Inspections'],
      datasets: [
        {
          label: 'Monthly Statistics',
          data: [250, 180, 45, 30],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
            'rgba(245, 158, 11, 0.5)',
            'rgba(99, 102, 241, 0.5)'
          ],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="flex flex-wrap">
        <div className="w-full rounded-3xl bg-white p-6 shadow-xl lg:w-8/12">
          <div className="mb-8 flex items-center justify-between text-black">
            <p className="text-2xl font-bold">
              {props.title || "Healthcare & Food Management"}
            </p>
            <p className="">{new Date().toLocaleDateString("en-US")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Patient Trends</h3>
              <Line data={patientData} options={{ responsive: true }} />
            </div>
          
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Meal Distribution</h3>
              <Pie data={mealData} options={{ responsive: true }} />
            </div>
          
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Staff Distribution</h3>
              <Bar data={staffData} options={{ responsive: true }} />
            </div>
          
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">120</p>
                  <p className="text-sm text-gray-600">Active Patients</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">350</p>
                  <p className="text-sm text-gray-600">Daily Meals</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">75</p>
                  <p className="text-sm text-gray-600">Menu Items</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">20</p>
                  <p className="text-sm text-gray-600">Staff Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div className="mt-8 w-full lg:mt-0 lg:w-4/12 lg:pl-4">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-6">Canteen Safety & Health Monitoring</h3>
          
            <div className="mb-8">
              <h4 className="text-md font-medium mb-4">Food Safety & Hygiene Trends</h4>
              <Line data={foodSafetyData} options={{ responsive: true }} />
            </div>
          
            <div className="mb-8">
              <h4 className="text-md font-medium mb-4">University Health Services</h4>
              <Bar data={healthMetricsData} options={{ responsive: true }} />
            </div>
          
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Food Safety Rating</span>
                <span className="text-lg font-semibold text-green-600">95%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Health Compliance</span>
                <span className="text-lg font-semibold text-blue-600">98%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-600">Student Satisfaction</span>
                <span className="text-lg font-semibold text-yellow-600">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
