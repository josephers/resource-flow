import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FolderKanban, Users, Play, Coins } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import TeamManager from './components/TeamManager';
import { Project, Role, TeamMember, Allocation, MemberType } from './types';
import { getNextMonths } from './utils';

// Initial Mock Data
const INITIAL_ROLES: Role[] = [
  { id: '1', title: 'Senior Developer', defaultHourlyRate: 150 },
  { id: '2', title: 'UI/UX Designer', defaultHourlyRate: 135 },
  { id: '3', title: 'Project Manager', defaultHourlyRate: 160 },
  { id: '4', title: 'QA Engineer', defaultHourlyRate: 110 },
];

const INITIAL_MEMBERS: TeamMember[] = [
  { id: '1', name: 'Sarah Jenkins', roleId: '1', avatarUrl: 'https://picsum.photos/seed/sarah/100/100', type: MemberType.FULL_TIME },
  { id: '2', name: 'Mike Ross', roleId: '3', avatarUrl: 'https://picsum.photos/seed/mike/100/100', type: MemberType.CONTRACTOR },
  { id: '3', name: 'Jessica Lee', roleId: '2', avatarUrl: 'https://picsum.photos/seed/jess/100/100', type: MemberType.FULL_TIME },
  { id: '4', name: 'David Kim', roleId: '1', avatarUrl: 'https://picsum.photos/seed/david/100/100', type: MemberType.CONSULTANT },
];

const INITIAL_PROJECTS: Project[] = [
  { id: '1', name: 'E-Commerce Revamp', client: 'Acme Corp', status: 'Active', color: 'bg-indigo-500' },
  { id: '2', name: 'Mobile App MVP', client: 'Startup Inc', status: 'Planning', color: 'bg-emerald-500' },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'team'>('dashboard');
  
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  // Init allocations for demo
  useEffect(() => {
    if (allocations.length === 0) {
      const demoAllocations: Allocation[] = [];
      const months = getNextMonths(3);
      // Project 1: Sarah (100%), Mike (50%)
      months.forEach(m => {
        demoAllocations.push({ id: crypto.randomUUID(), projectId: '1', memberId: '1', month: m, percentage: 100 });
        demoAllocations.push({ id: crypto.randomUUID(), projectId: '1', memberId: '2', month: m, percentage: 50 });
      });
      // Project 2: Jessica (100%), David (80%)
      months.forEach(m => {
        demoAllocations.push({ id: crypto.randomUUID(), projectId: '2', memberId: '3', month: m, percentage: 100 });
        demoAllocations.push({ id: crypto.randomUUID(), projectId: '2', memberId: '4', month: m, percentage: 80 });
      });
      setAllocations(demoAllocations);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRole = (role: Role) => setRoles(prev => [...prev, role]);
  const deleteRole = (id: string) => setRoles(prev => prev.filter(r => r.id !== id));
  
  const addMember = (member: TeamMember) => setMembers(prev => [...prev, member]);
  const deleteMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

  const addProject = (project: Project) => setProjects(prev => [...prev, project]);
  
  const addAllocation = (alloc: Allocation) => setAllocations(prev => [...prev, alloc]);
  const updateAllocation = (alloc: Allocation) => {
    setAllocations(prev => prev.map(a => a.id === alloc.id ? alloc : a));
  };
  const deleteAllocation = (id: string) => setAllocations(prev => prev.filter(a => a.id !== id));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full transition-all z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
            <Coins size={20} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">ResourceFlow</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveView('projects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'projects' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800'}`}
          >
            <FolderKanban size={20} />
            <span className="font-medium">Projects & Plan</span>
          </button>

          <button 
            onClick={() => setActiveView('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'team' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800'}`}
          >
            <Users size={20} />
            <span className="font-medium">Team & Roles</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="bg-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-2 uppercase font-semibold tracking-wider">Projected Revenue</p>
              <p className="text-xl font-bold text-white">$142,500</p>
              <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 w-[70%] h-full rounded-full"></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-right">70% of Goal</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeView}</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your agency resources effectively.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">admin@resourceflow.ai</p>
             </div>
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
               AU
             </div>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <Dashboard 
            projects={projects}
            allocations={allocations}
            roles={roles}
            members={members}
          />
        )}

        {activeView === 'projects' && (
          <ProjectList 
            projects={projects}
            allocations={allocations}
            roles={roles}
            members={members}
            onAddProject={addProject}
            onAddAllocation={addAllocation}
            onUpdateAllocation={updateAllocation}
            onDeleteAllocation={deleteAllocation}
          />
        )}

        {activeView === 'team' && (
          <TeamManager 
            roles={roles}
            members={members}
            projects={projects}
            allocations={allocations}
            onAddRole={addRole}
            onDeleteRole={deleteRole}
            onAddMember={addMember}
            onDeleteMember={deleteMember}
          />
        )}

      </main>
    </div>
  );
};

export default App;