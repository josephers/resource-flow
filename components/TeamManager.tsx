import React, { useState, useMemo } from 'react';
import { Role, TeamMember, Project, Allocation, MemberType } from '../types';
import { Plus, Trash2, User, Briefcase, DollarSign, ChevronDown, ChevronRight, Settings, Calendar, Tag, Filter } from 'lucide-react';
import { getNextMonths, getMonthName } from '../utils';

interface TeamManagerProps {
  roles: Role[];
  members: TeamMember[];
  projects: Project[];
  allocations: Allocation[];
  onAddRole: (role: Role) => void;
  onDeleteRole: (id: string) => void;
  onAddMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ 
  roles, members, projects, allocations,
  onAddRole, onDeleteRole, onAddMember, onDeleteMember 
}) => {
  const [activeTab, setActiveTab] = useState<'capacity' | 'directory'>('capacity');
  const [directorySubTab, setDirectorySubTab] = useState<'members' | 'roles'>('members');
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set(members.map(m => m.id)));

  // Filter State
  const [memberTypeFilter, setMemberTypeFilter] = useState<MemberType | 'ALL'>('ALL');

  // Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRoleId, setNewMemberRoleId] = useState('');
  const [newMemberType, setNewMemberType] = useState<MemberType>(MemberType.FULL_TIME);

  // Role Form State
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleRate, setNewRoleRate] = useState('');

  const months = useMemo(() => getNextMonths(18), []);

  const toggleMemberExpand = (memberId: string) => {
    const newSet = new Set(expandedMembers);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setExpandedMembers(newSet);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberRoleId) return;
    onAddMember({
      id: crypto.randomUUID(),
      name: newMemberName,
      roleId: newMemberRoleId,
      avatarUrl: `https://picsum.photos/seed/${newMemberName}/100/100`,
      type: newMemberType
    });
    setNewMemberName('');
    setNewMemberRoleId('');
    setNewMemberType(MemberType.FULL_TIME);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle || !newRoleRate) return;
    onAddRole({
      id: crypto.randomUUID(),
      title: newRoleTitle,
      defaultHourlyRate: parseFloat(newRoleRate)
    });
    setNewRoleTitle('');
    setNewRoleRate('');
  };

  const getMemberTypeBadge = (type: MemberType) => {
    switch(type) {
      case MemberType.FULL_TIME:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">Full Time</span>;
      case MemberType.CONTRACTOR:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Contractor</span>;
      case MemberType.CONSULTANT:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">Consultant</span>;
      default:
        return null;
    }
  };

  const renderCapacityView = () => {
    const filteredMembers = members.filter(m => memberTypeFilter === 'ALL' || m.type === memberTypeFilter);

    // Calculate Total FTE per month for the footer
    const monthlyFTEs = months.map(m => {
       const totalPct = allocations
          .filter(a => a.month === m && filteredMembers.some(fm => fm.id === a.memberId))
          .reduce((sum, a) => sum + a.percentage, 0);
       return totalPct / 100;
    });

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
         <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
               <Calendar size={18} className="text-indigo-600" />
               Resource Capacity Plan
            </h3>
            
            <div className="flex items-center gap-6">
                {/* Filter Control */}
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                        value={memberTypeFilter}
                        onChange={(e) => setMemberTypeFilter(e.target.value as MemberType | 'ALL')}
                        className="text-xs border-none bg-transparent focus:ring-0 font-medium text-slate-600 cursor-pointer outline-none pr-1"
                    >
                        <option value="ALL">All Resource Types</option>
                        {Object.values(MemberType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4 hidden sm:flex">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100%</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> &lt;100%</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> &gt;100%</span>
                </div>
            </div>
         </div>
         
         <div className="overflow-auto flex-1 relative">
            <table className="w-full min-w-[800px] border-collapse">
              <thead className="sticky top-0 z-20 bg-white shadow-sm">
                 <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[250px] bg-slate-50/80 backdrop-blur sticky left-0 z-30 border-b border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                       Team Member
                    </th>
                    {months.map(m => (
                       <th key={m} className="text-center py-3 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[60px] border-b border-slate-100">
                          {getMonthName(m)}
                       </th>
                    ))}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMembers.map(member => {
                  const role = roles.find(r => r.id === member.roleId);
                  const isExpanded = expandedMembers.has(member.id);
                  
                  // Calculate Member Totals
                  const memberMonthlyTotals = months.map(m => {
                    return allocations
                      .filter(a => a.memberId === member.id && a.month === m)
                      .reduce((sum, a) => sum + a.percentage, 0);
                  });

                  // Identify projects this member is on (across all displayed months)
                  const memberProjectIds = Array.from(new Set(
                     allocations
                       .filter(a => a.memberId === member.id && months.includes(a.month))
                       .map(a => a.projectId)
                  ));

                  return (
                    <React.Fragment key={member.id}>
                      {/* Summary Row */}
                      <tr className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-6 sticky left-0 z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                           <div className="flex items-center gap-3">
                              <button onClick={() => toggleMemberExpand(member.id)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                 {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                              </button>
                              <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-slate-100" />
                              <div className="min-w-0">
                                 <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                                    {getMemberTypeBadge(member.type)}
                                 </div>
                                 <p className="text-xs text-slate-400 truncate">{role?.title}</p>
                              </div>
                           </div>
                        </td>
                        {memberMonthlyTotals.map((total, idx) => {
                           let badgeClass = 'bg-slate-100 text-slate-400';
                           if (total === 100) badgeClass = 'bg-emerald-100 text-emerald-700 font-bold';
                           else if (total > 100) badgeClass = 'bg-red-100 text-red-700 font-bold';
                           else if (total > 0) badgeClass = 'bg-amber-100 text-amber-700';
                           
                           return (
                             <td key={months[idx]} className="text-center p-1 border-r border-slate-50/50">
                                <div className={`text-xs py-1 rounded mx-0.5 ${badgeClass}`}>
                                  {total}%
                                </div>
                             </td>
                           );
                        })}
                      </tr>
                      
                      {/* Breakdown Rows */}
                      {isExpanded && (
                         <>
                           {/* Project Rows */}
                           {memberProjectIds.map(projectId => {
                              const project = projects.find(p => p.id === projectId);
                              return (
                                 <tr key={projectId} className="bg-slate-50/30">
                                    <td className="py-1 px-6 pl-14 sticky left-0 z-10 bg-slate-50/80 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                                       <div className="flex items-center gap-2 overflow-hidden">
                                          <div className={`w-2 h-2 rounded-full ${project?.color || 'bg-gray-400'}`}></div>
                                          <span className="text-xs text-slate-600 truncate max-w-[150px]">{project?.name || 'Unknown Project'}</span>
                                       </div>
                                    </td>
                                    {months.map(m => {
                                       const alloc = allocations.find(a => a.memberId === member.id && a.projectId === projectId && a.month === m);
                                       return (
                                          <td key={m} className="text-center p-1 border-r border-slate-100/50">
                                             {alloc && alloc.percentage > 0 ? (
                                                <span className="text-[10px] font-medium text-slate-600">{alloc.percentage}%</span>
                                             ) : (
                                                <span className="text-slate-200">-</span>
                                             )}
                                          </td>
                                       );
                                    })}
                                 </tr>
                              );
                           })}
                           
                           {/* Unallocated / Bench Row */}
                           <tr className="bg-slate-50/30 border-b border-slate-100">
                              <td className="py-1 px-6 pl-14 sticky left-0 z-10 bg-slate-50/80 backdrop-blur shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100">
                                 <span className="text-xs text-slate-400 italic">Unallocated / Bench</span>
                              </td>
                              {memberMonthlyTotals.map((total, idx) => {
                                 const remaining = 100 - total;
                                 return (
                                    <td key={months[idx]} className="text-center p-1 border-r border-slate-100/50">
                                       {remaining > 0 ? (
                                          <span className="text-[10px] font-medium text-slate-400 italic">{remaining}%</span>
                                       ) : (
                                          <span className="text-slate-200">-</span>
                                       )}
                                    </td>
                                 );
                              })}
                           </tr>
                         </>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 z-20">
                <tr className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                    <td className="py-3 px-6 sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Total FTE</span>
                            <span className="text-[10px] font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                                {filteredMembers.length} Members
                            </span>
                        </div>
                    </td>
                    {monthlyFTEs.map((fte, idx) => (
                        <td key={months[idx]} className="text-center py-3 px-1 text-xs border-r border-slate-200 bg-slate-50">
                            {fte.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </td>
                    ))}
                </tr>
              </tfoot>
            </table>
         </div>
      </div>
    );
  };

  const renderDirectoryView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        
        {/* Sidebar/Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => setDirectorySubTab('members')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${directorySubTab === 'members' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Team Members
              </button>
              <button 
                onClick={() => setDirectorySubTab('roles')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${directorySubTab === 'roles' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Roles & Rates
              </button>
            </div>

            {directorySubTab === 'members' ? (
              <form onSubmit={handleAddMember} className="space-y-4">
                <h3 className="font-semibold text-slate-800">Add Team Member</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={newMemberName} 
                    onChange={e => setNewMemberName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                  <select 
                    value={newMemberRoleId} 
                    onChange={e => setNewMemberRoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.title} (${r.defaultHourlyRate}/hr)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Member Type</label>
                  <select 
                    value={newMemberType} 
                    onChange={e => setNewMemberType(e.target.value as MemberType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    {Object.values(MemberType).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Member
                </button>
              </form>
            ) : (
               <form onSubmit={handleAddRole} className="space-y-4">
                <h3 className="font-semibold text-slate-800">Add Role</h3>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Role Title</label>
                  <input 
                    type="text" 
                    value={newRoleTitle} 
                    onChange={e => setNewRoleTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Senior Backend Dev"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Default Hourly Rate ($)</label>
                  <input 
                    type="number" 
                    value={newRoleRate} 
                    onChange={e => setNewRoleRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="120"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Role
                </button>
              </form>
            )}
          </div>
        </div>

        {/* List Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  {directorySubTab === 'members' ? <User size={18} /> : <Briefcase size={18} />}
                  {directorySubTab === 'members' ? `All Team Members (${members.length})` : `Defined Roles (${roles.length})`}
               </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {directorySubTab === 'members' ? (
                 members.length === 0 ? (
                   <div className="p-8 text-center text-slate-400 text-sm">No members added yet.</div>
                 ) : (
                   members.map(member => {
                     const role = roles.find(r => r.id === member.roleId);
                     return (
                       <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-4">
                           <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                           <div>
                             <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-800">{member.name}</p>
                                {getMemberTypeBadge(member.type)}
                             </div>
                             <p className="text-xs text-slate-500">{role?.title || 'Unknown Role'}</p>
                           </div>
                         </div>
                         <button onClick={() => onDeleteMember(member.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     );
                   })
                 )
              ) : (
                  roles.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No roles defined yet.</div>
                  ) : (
                    roles.map(role => (
                      <div key={role.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                             <Briefcase size={18} />
                           </div>
                           <div>
                             <p className="text-sm font-medium text-slate-800">{role.title}</p>
                             <div className="flex items-center gap-1 text-xs text-slate-500">
                               <DollarSign size={12} />
                               {role.defaultHourlyRate} / hour
                             </div>
                           </div>
                        </div>
                        <button onClick={() => onDeleteRole(role.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
        <button 
          onClick={() => setActiveTab('capacity')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'capacity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Calendar size={16} /> Capacity Planning
        </button>
        <button 
          onClick={() => setActiveTab('directory')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'directory' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Settings size={16} /> Directory & Settings
        </button>
      </div>

      {activeTab === 'capacity' ? renderCapacityView() : renderDirectoryView()}
    </div>
  );
};

export default TeamManager;