import React, { useEffect, useState } from 'react';
import { Plus, Dumbbell, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

const WorkoutPlans = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [activeDay, setActiveDay] = useState('Monday');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Exercise Form State
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exWeight, setExWeight] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canModify = ['super_admin', 'trainer', 'manager'].includes(currentUser.role);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchWorkouts(selectedMember);
    } else {
      setWorkouts([]);
    }
  }, [selectedMember]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('members/');
      setMembers(res.data);
      if (res.data.length > 0) {
        setSelectedMember(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkouts = async (memberId) => {
    setLoading(true);
    try {
      const res = await api.get(`workouts/?member=${memberId}`);
      setWorkouts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get exercises for the active day
  const activeDayWorkout = workouts.find(w => w.day_of_week === activeDay);
  const exerciseList = activeDayWorkout ? activeDayWorkout.exercises : [];

  const handleAddExercise = async (e) => {
    e.preventDefault();
    if (!exName || !exSets || !exReps) return;

    setSaving(true);
    const newExercise = {
      name: exName,
      sets: parseInt(exSets),
      reps: parseInt(exReps),
      weight: exWeight || 'Bodyweight'
    };

    const updatedExercises = [...exerciseList, newExercise];

    try {
      if (activeDayWorkout) {
        // Update existing plan
        await api.put(`workouts/${activeDayWorkout.id}/`, {
          member: parseInt(selectedMember),
          day_of_week: activeDay,
          exercises: updatedExercises
        });
      } else {
        // Create new plan
        await api.post('workouts/', {
          member: parseInt(selectedMember),
          day_of_week: activeDay,
          exercises: updatedExercises
        });
      }

      // Clear form & refetch
      setExName('');
      setExSets('');
      setExReps('');
      setExWeight('');
      fetchWorkouts(selectedMember);
    } catch (err) {
      console.error(err);
      alert('Failed to save exercise.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async (indexToDelete) => {
    if (!activeDayWorkout) return;

    if (window.confirm('Delete this exercise from the workout plan?')) {
      setSaving(true);
      const updatedExercises = exerciseList.filter((_, idx) => idx !== indexToDelete);

      try {
        if (updatedExercises.length === 0) {
          // Delete plan record entirely if no exercises remain
          await api.delete(`workouts/${activeDayWorkout.id}/`);
        } else {
          // Update plan record with remaining exercises
          await api.put(`workouts/${activeDayWorkout.id}/`, {
            member: parseInt(selectedMember),
            day_of_week: activeDay,
            exercises: updatedExercises
          });
        }
        fetchWorkouts(selectedMember);
      } catch (err) {
        console.error(err);
        alert('Failed to delete exercise.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Workout Routines
        </h1>
        <p className="text-slate-400 text-sm mt-1">Design daily schedules, exercises, sets, reps, and targets for gym members.</p>
      </div>

      {/* Selector and Main Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column: Selector & Form */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Select Member Profile</h3>
            <div>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                ))}
              </select>
            </div>
          </div>

          {canModify && selectedMember && (
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-slate-200">Add Exercise to {activeDay}</h3>
              <form onSubmit={handleAddExercise} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exercise Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incline Bench Press"
                    value={exName}
                    onChange={(e) => setExName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sets</label>
                    <input
                      type="number"
                      required
                      placeholder="4"
                      value={exSets}
                      onChange={(e) => setExSets(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reps</label>
                    <input
                      type="number"
                      required
                      placeholder="12"
                      value={exReps}
                      onChange={(e) => setExReps(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Weight</label>
                    <input
                      type="text"
                      placeholder="60kg"
                      value={exWeight}
                      onChange={(e) => setExWeight(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#892D56] hover:bg-[#a13868] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Exercise'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Weekly Plan Routines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Days Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 border-b border-[var(--border-primary)]">
            {daysOfWeek.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${activeDay === day
                    ? 'bg-[#892D56] text-white'
                    : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
                  }`}
              >
                {day}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-sm text-slate-500">Loading workout plan...</div>
          ) : exerciseList.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-[#892D56]/20 rounded-full text-[#892D56]">
                <Dumbbell size={28} />
              </div>
              <h4 className="text-md font-bold text-slate-300">No Workout Logged for {activeDay}</h4>
              <p className="text-xs text-slate-500 max-w-sm">Assign weekly routines, reps, sets, and targets to help guide client progress.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exerciseList.map((ex, idx) => (
                <div key={idx} className="glass-card p-4 rounded-xl flex justify-between items-center border border-[var(--border-primary)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#892D56]/20 rounded-lg text-[#892D56]">
                      <Dumbbell size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{ex.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.sets} Sets × {ex.reps} Reps • {ex.weight}</p>
                    </div>
                  </div>
                  {canModify && (
                    <button
                      onClick={() => handleDeleteExercise(idx)}
                      disabled={saving}
                      className="p-2 hover:bg-rose-500/15 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default WorkoutPlans;
