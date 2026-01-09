import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Project, Allocation, Role, TeamMember, MemberType } from '../types';
import { Plus, X, Briefcase, UserPlus } from 'lucide-react';
import { getBusinessHoursInMonth, formatCurrency, getMonthName, getNextMonths } from '../utils';

interface ProjectListProps {
  projects: Project[];
  allocations: Allocation[];
  roles: Role[];
  members: TeamMember[];
  onAddProject: (project: Project) => void;
  onAddAllocation: (alloc: Allocation) => void;
  onUpdateAllocation: (alloc: Allocation) => void;
  onDeleteAllocation: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  projects, allocations, roles, members, 
  onAddProject, onAddAllocation, onUpdateAllocation, onDeleteAllocation 
}) => {
  // State for new project modal/inline
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');

  // State for added members (temporarily visible before allocation)
  // Map<ProjectId, Set<MemberId>>
  const [addedMembers, setAddedMembers] = useState<Record<string, string[]>>({});

  // Cell Editing State (Manual Input)
  const [editingCell, setEditingCell] = useState<{ projectId: string, memberId: string, month: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Drag / Paint State
  const dragState = useRef({
    active: false,
    projectId: '',
    memberId: '',
    startMonth: '',
    startValue: 0,
    paintValue: 0, // The value we are painting (100 or 0)
    hasMoved: false, // Tracks if user dragged or just clicked
    paintedCells: new Set<string>(), // Tracks cells updated in current drag to avoid dupes
  });

  // State for adding member inline menu (ProjectId | null)
  const [addingMemberProject, setAddingMemberProject] = useState<string | null>(null);

  const months = useMemo(() => getNextMonths(18), []);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  // Global mouse up to stop dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragState.current.active) {
        // If we were dragging and finished, ensure state is cleared
        dragState.current.active = false;
        dragState.current.paintedCells.clear();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: newProjectName,
      client: newProjectClient || 'Internal',
      status: 'Planning',
      color: 'bg-indigo-500' // Default, could be random
    };
    onAddProject(newProject);
    setNewProjectName('');
    setNewProjectClient('');
    setIsCreatingProject(false);
  };

  const handleAddMemberToProject = (projectId: string, memberId: string) => {
    setAddedMembers(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), memberId]
    }));
    // Close the menu after adding
    setAddingMemberProject(null);
  };

  const handleRemoveMemberFromProject = (projectId: string, memberId: string) => {
    // 1. Remove from local added state
    setAddedMembers(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(id => id !== memberId)
    }));
    
    // 2. Delete all allocations for this member on this project
    const projectMemberAllocations = allocations.filter(a => a.projectId === projectId && a.memberId === memberId);
    projectMemberAllocations.forEach(a => onDeleteAllocation(a.id));
  };

  // --- Helper to update allocations safely ---
  const updateAllocationValue = (projectId: string, memberId: string, month: string, newValue: number) => {
    const existingAllocation = allocations.find(a => 
      a.projectId === projectId && a.memberId === memberId && a.month === month
    );

    if (newValue > 0) {
      if (existingAllocation) {
        // Only update if changed to avoid thrashing (though paintedCells check handles most)
        if (existingAllocation.percentage !== newValue) {
          onUpdateAllocation({ ...existingAllocation, percentage: newValue });
        }
      } else {
        onAddAllocation({
          id: crypto.randomUUID(),
          projectId,
          memberId,
          month,
          percentage: newValue
        });
      }
    } else {
      if (existingAllocation) {
        onDeleteAllocation(existingAllocation.id);
      }
    }
  };

  // --- Mouse Interaction Handlers ---

  const handleCellMouseDown = (projectId: string, memberId: string, month: string, currentVal: number, e: React.MouseEvent) => {
    // Prevent default to avoid text selection dragging
    e.preventDefault();
    
    // Determine Paint Value:
    // If starting on 0 -> Paint 100
    // If starting on > 0 -> Paint 0 (Clear)
    const paintValue = currentVal === 0 ? 100 : 0;

    dragState.current = {
      active: true,
      projectId,
      memberId,
      startMonth: month,
      startValue: currentVal,
      paintValue,
      hasMoved: false,
      paintedCells: new Set()
    };
  };

  const handleCellMouseEnter = (projectId: string, memberId: string, month: string) => {
    if (!dragState.current.active) return;
    
    // Only paint if we are on the same row (same project & member)
    if (dragState.current.projectId !== projectId || dragState.current.memberId !== memberId) return;

    // Detect if we just started dragging (moved from start cell to a new one)
    if (!dragState.current.hasMoved && month !== dragState.current.startMonth) {
       dragState.current.hasMoved = true;
       
       // We must paint the start cell now, because we are leaving it
       const startKey = `${projectId}-${memberId}-${dragState.current.startMonth}`;
       if (!dragState.current.paintedCells.has(startKey)) {
          updateAllocationValue(projectId, memberId, dragState.current.startMonth, dragState.current.paintValue);
          dragState.current.paintedCells.add(startKey);
       }
    }
    
    // If we are already moving, paint the current cell
    if (dragState.current.hasMoved) {
      const currentKey = `${projectId}-${memberId}-${month}`;
      if (!dragState.current.paintedCells.has(currentKey)) {
        updateAllocationValue(projectId, memberId, month, dragState.current.paintValue);
        dragState.current.paintedCells.add(currentKey);
      }
    }
  };

  const handleCellMouseUp = (projectId: string, memberId: string, month: string, currentVal: number) => {
    if (!dragState.current.active) return;
    
    // If we haven't moved, treat it as a Click Cycle
    if (!dragState.current.hasMoved) {
      // Cycle: 0 -> 100 -> 50 -> 0
      let nextVal = 0;
      if (currentVal === 0) nextVal = 100;
      else if (currentVal === 100) nextVal = 50;
      else nextVal = 0; 
      
      updateAllocationValue(projectId, memberId, month, nextVal);
    } 
    // If we moved, the cells (including start and current) were painted during MouseEnter
    
    dragState.current.active = false;
    dragState.current.paintedCells.clear();
  };

  const startEditing = (projectId: string, memberId: string, month: string, currentVal: number) => {
    setEditingCell({ projectId, memberId, month });
    setEditValue(currentVal > 0 ? currentVal.toString() : '');
    // Cancel any drag
    dragState.current.active = false;
  };

  const saveEditing = () => {
    if (!editingCell) return;
    const { projectId, memberId, month } = editingCell;
    const newValue = parseInt(editValue);

    if (!isNaN(newValue)) {
      updateAllocationValue(projectId, memberId, month, newValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const calculateProjectTotal = (projId: string) => {
    return allocations
      .filter(a => a.projectId === projId)
      .reduce((sum, alloc) => {
        const member = members.find(m => m.id === alloc.memberId);
        const role = roles.find(r => r.id === member?.roleId);
        if (!member || !role) return sum;
        const hours = getBusinessHoursInMonth(alloc.month) * (alloc.percentage / 100);
        return sum + (hours * role.defaultHourlyRate);
      }, 0);
  };

  const getMemberTypeAbbrev = (type: MemberType) => {
     switch(type) {
       case MemberType.FULL_TIME: return 'FT';
       case MemberType.CONTRACTOR: return 'Contr.';
       case MemberType.CONSULTANT: return 'SOW';
       default: return '';
     }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      
      {/* Top Bar Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Briefcase className="text-indigo-600" size={20}/> 
          Project Portfolio
        </h2>
        
        {isCreatingProject ? (
          <form onSubmit={handleCreateProject} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <input 
              autoFocus
              type="text" 
              placeholder="Project Name" 
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Client" 
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
              value={newProjectClient}
              onChange={e => setNewProjectClient(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={18} />
            </button>
            <button type="button" onClick={() => setIsCreatingProject(false)} className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-slate-200 transition-colors">
              <X size={18} />
            </button>
          </form>
        ) : (
          <button 
            onClick={() => setIsCreatingProject(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {/* Projects Grid Container */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 pb-20 select-none">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Briefcase size={48} className="mb-4 text-slate-200" />
            <p>No projects yet. Create one to get started.</p>
          </div>
        ) : (
          projects.map(project => {
            // Determine visible members for this project
            const allocatedMemberIds = new Set(allocations.filter(a => a.projectId === project.id).map(a => a.memberId));
            const manualMemberIds = addedMembers[project.id] || [];
            const allVisibleMemberIds = Array.from(new Set([...allocatedMemberIds, ...manualMemberIds]));
            
            const visibleMembers = members.filter(m => allVisibleMemberIds.includes(m.id));

            return (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Project Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm ${project.color || 'bg-indigo-500'}`}>
                        <Briefcase size={20} />
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                       <p className="text-sm text-slate-500">{project.client}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Est.</p>
                       <p className="text-lg font-bold text-slate-700">{formatCurrency(calculateProjectTotal(project.id))}</p>
                    </div>
                  </div>
                </div>

                {/* Resource Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="w-[250px] text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          Team Member
                        </th>
                        {months.map(m => (
                          <th key={m} className="text-center py-3 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[60px]">
                            {getMonthName(m)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visibleMembers.map(member => {
                        const role = roles.find(r => r.id === member.roleId);
                        return (
                          <tr key={member.id} className="group hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-6 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/80 transition-colors">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-slate-100" />
                                    <div className="min-w-0">
                                       <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                                       <div className="flex items-center gap-1">
                                          <p className="text-xs text-slate-400 truncate">{role?.title}</p>
                                          <span className="text-[10px] text-slate-300">•</span>
                                          <span className="text-[10px] text-slate-400 font-medium">{getMemberTypeAbbrev(member.type)}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                  onClick={() => handleRemoveMemberFromProject(project.id, member.id)}
                                  className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5" 
                                  title="Remove from project"
                                 >
                                    <X size={14} />
                                 </button>
                               </div>
                            </td>
                            {months.map(month => {
                              const alloc = allocations.find(a => a.projectId === project.id && a.memberId === member.id && a.month === month);
                              const percentage = alloc?.percentage || 0;
                              const isEditing = editingCell?.projectId === project.id && editingCell?.memberId === member.id && editingCell?.month === month;
                              
                              // Visual Calculation
                              const opacity = Math.max(0.1, percentage / 100);
                              const bgColor = percentage > 0 
                                ? (percentage > 100 ? 'bg-red-500' : 'bg-indigo-600') 
                                : 'bg-transparent';
                              
                              return (
                                <td key={month} className="p-0.5 h-12 relative">
                                  {isEditing ? (
                                    <div className="absolute inset-0 z-20">
                                      <input
                                        ref={editInputRef}
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full h-full text-center border-2 border-indigo-500 rounded-none focus:outline-none text-xs font-bold shadow-lg"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={saveEditing}
                                        onKeyDown={e => e.key === 'Enter' && saveEditing()}
                                      />
                                    </div>
                                  ) : (
                                    <div 
                                      onMouseDown={(e) => handleCellMouseDown(project.id, member.id, month, percentage, e)}
                                      onMouseEnter={() => handleCellMouseEnter(project.id, member.id, month)}
                                      onMouseUp={() => handleCellMouseUp(project.id, member.id, month, percentage)}
                                      onDoubleClick={() => startEditing(project.id, member.id, month, percentage)}
                                      className={`
                                        w-full h-full rounded flex items-center justify-center cursor-pointer transition-colors
                                        ${percentage === 0 ? 'hover:bg-slate-100' : ''}
                                      `}
                                    >
                                      {percentage > 0 && (
                                        <div 
                                          className={`w-full h-full rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition-all ${bgColor}`}
                                          style={{ opacity: percentage > 100 ? 1 : opacity }}
                                        >
                                          {percentage}%
                                        </div>
                                      )}
                                      {percentage === 0 && (
                                        <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 text-slate-300">
                                           <Plus size={12} />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      
                      {/* Add Member Row */}
                      <tr>
                        <td className="py-3 px-6 bg-white sticky left-0 z-10 border-t border-slate-50 align-top">
                          {addingMemberProject === project.id ? (
                            <div className="w-full bg-white rounded-lg border border-indigo-100 shadow-sm p-3 animate-in fade-in slide-in-from-top-2 relative z-20">
                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-indigo-50">
                                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Select Member</span>
                                    <button onClick={() => setAddingMemberProject(null)} className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1"><X size={14}/></button>
                                </div>
                                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {members
                                        .filter(m => !visibleMembers.find(vm => vm.id === m.id))
                                        .map(m => (
                                            <button 
                                                key={m.id}
                                                onClick={() => handleAddMemberToProject(project.id, m.id)}
                                                className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-lg flex items-center gap-3 transition-colors group/item border border-transparent hover:border-indigo-100"
                                            >
                                                <img src={m.avatarUrl} className="w-8 h-8 rounded-full bg-slate-200" alt=""/>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{roles.find(r=>r.id===m.roleId)?.title}</p>
                                                </div>
                                                <Plus size={16} className="text-indigo-400 opacity-0 group-hover/item:opacity-100" />
                                            </button>
                                        ))
                                    }
                                    {members.filter(m => !visibleMembers.find(vm => vm.id === m.id)).length === 0 && (
                                        <div className="py-4 text-center">
                                          <p className="text-xs text-slate-400">All available members added.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                          ) : (
                            <button 
                                onClick={() => setAddingMemberProject(project.id)}
                                className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors py-1 px-1 rounded hover:bg-indigo-50"
                            >
                              <UserPlus size={16} />
                              <span>Add Team Member</span>
                            </button>
                          )}
                        </td>
                        <td colSpan={months.length} className="bg-slate-50/30"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectList;