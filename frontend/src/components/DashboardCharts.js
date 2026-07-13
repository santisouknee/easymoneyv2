'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function CollectionTrendChart({ data = [] }) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Collected Amount (฿)',
        data: data.map(item => parseFloat(item.total || 0)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgb(148, 163, 184)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgb(148, 163, 184)' }
      }
    }
  };

  return <Line data={chartData} options={options} />;
}

export function OutstandingBalanceChart({ data = [] }) {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Outstanding Balance (฿)',
        data: data.map(item => parseFloat(item.total || 0)),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'rgb(148, 163, 184)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgb(148, 163, 184)' }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
}

export function PaymentStatusChart({ data = [] }) {
  const chartData = {
    labels: data.map(item => item.status),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // Paid - Green
          'rgba(99, 102, 241, 0.8)',  // Pending - Indigo
          'rgba(245, 158, 11, 0.8)',  // Partial - Amber
          'rgba(239, 68, 68, 0.8)'    // Overdue - Red
        ],
        borderWidth: 1,
        borderColor: 'rgba(30, 41, 59, 1)'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 }
        }
      }
    }
  };

  return <Doughnut data={chartData} options={options} />;
}
