// ==== REPORTS PAGE ====

document.addEventListener('DOMContentLoaded', initReports);

async function initReports(){
  if(!authManager.requireAuth()) return;

  try{
    const resp = await authManager.apiRequest('/stats/dashboard');
    if(!resp.success) throw new Error(resp.error||'Eroare API');
    const data=resp.data||{};
    buildSummaryCards(data);
    buildCharts(data);
  }catch(e){
    console.error('Reports error',e);
    document.getElementById('content').style.display='block';
    document.getElementById('content').textContent='Eroare la încărcarea rapoartelor';
  }
}

function buildSummaryCards(data){
  const container=document.getElementById('summaryCards');
  if(!container) return;
  const cards=[
    {label:'Locații',value:data.totalLocations||0},
    {label:'Comenzi active',value:data.activeOrders||0},
    {label:'Venit azi',value:(data.todayRevenue||0)+' RON'}
  ];
  container.innerHTML=cards.map(c=>`<div class="card"><h2>${c.value}</h2><p>${c.label}</p></div>`).join('');
}

function buildCharts(data){
  // Orders daily line chart
  if(Array.isArray(data.ordersDaily)&&data.ordersDaily.length){
    const labels=data.ordersDaily.map(d=>d.date||d.day||'');
    const values=data.ordersDaily.map(d=>d.count||d.total||0);
    new Chart(document.getElementById('ordersChart'),{
      type:'line',
      data:{labels,datasets:[{label:'Comenzi/zi',data:values,borderColor:'#6366f1',backgroundColor:'rgba(99,102,241,0.1)',tension:0.3}]},
      options:{scales:{y:{beginAtZero:true}}}
    });
  }

  // Equipment status pie chart
  if(Array.isArray(data.equipmentStatus)&&data.equipmentStatus.length){
    const labels=data.equipmentStatus.map(e=>e.status);
    const values=data.equipmentStatus.map(e=>e.count);
    new Chart(document.getElementById('equipmentChart'),{
      type:'doughnut',
      data:{labels,datasets:[{data:values,backgroundColor:['#10b981','#f59e0b','#ef4444','#3b82f6']}]},
      options:{plugins:{legend:{position:'bottom'}}}
    });
  }
} 