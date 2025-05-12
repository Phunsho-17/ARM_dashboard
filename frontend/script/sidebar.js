function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar-menu');
    sidebar.classList.toggle('collapsed');
}

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  window.addEventListener('DOMContentLoaded', () => {
    const ctx1 = document.getElementById('relationshipChart').getContext('2d');
    const ctx2 = document.getElementById('aiChart').getContext('2d');

    const grad1 = ctx1.createLinearGradient(0, 0, 600, 0);
    grad1.addColorStop(0, 'rgba(255,255,255,0.1)');
    grad1.addColorStop(1, '#636ae8');

    const grad2 = ctx2.createLinearGradient(0, 0, 600, 0);
    grad2.addColorStop(0, 'rgba(255,255,255,0.1)');
    grad2.addColorStop(1, '#636ae8');

    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Relationships Mapped',
          data: [20, 40, 15, 60, 35, 50, 30, 45, 20, 70, 90, 55],
          backgroundColor: grad1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { autoSkip: false } }
        }
      }
    });

    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'AI Analysis',
          data: [10, 60, 20, 45, 30, 70, 40, 50, 20, 60, 85, 65],
          backgroundColor: grad2
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
          y: { ticks: { autoSkip: false } }
        }
      }
    });
});
