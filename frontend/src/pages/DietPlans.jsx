import React, { useEffect, useState } from 'react';
import { Plus, Coffee, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

const DietPlans = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [diets, setDiets] = useState([]);
  const [activeDay, setActiveDay] = useState('Monday');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // New Meal Form State
  const [mealTime, setMealTime] = useState('');
  const [mealFood, setMealFood] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canModify = ['super_admin', 'trainer', 'manager'].includes(currentUser.role);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      fetchDiets(selectedMember);
    } else {
      setDiets([]);
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

  const fetchDiets = async (memberId) => {
    setLoading(true);
    try {
      const res = await api.get(`diets/?member=${memberId}`);
      setDiets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get meals for the active day
  const activeDayDiet = diets.find(d => d.day_of_week === activeDay);
  const mealList = activeDayDiet ? activeDayDiet.meals : [];

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!mealTime || !mealFood) return;

    setSaving(true);
    const newMeal = {
      time: mealTime,
      food: mealFood,
      calories: parseInt(mealCalories || '0'),
      protein: mealProtein || 'N/A'
    };

    const updatedMeals = [...mealList, newMeal];

    try {
      if (activeDayDiet) {
        // Update existing plan
        await api.put(`diets/${activeDayDiet.id}/`, {
          member: parseInt(selectedMember),
          day_of_week: activeDay,
          meals: updatedMeals
        });
      } else {
        // Create new plan
        await api.post('diets/', {
          member: parseInt(selectedMember),
          day_of_week: activeDay,
          meals: updatedMeals
        });
      }
      
      // Clear form & refetch
      setMealTime('');
      setMealFood('');
      setMealCalories('');
      setMealProtein('');
      fetchDiets(selectedMember);
    } catch (err) {
      console.error(err);
      alert('Failed to save meal.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeal = async (indexToDelete) => {
    if (!activeDayDiet) return;
    
    if (window.confirm('Delete this meal from the diet plan?')) {
      setSaving(true);
      const updatedMeals = mealList.filter((_, idx) => idx !== indexToDelete);
      
      try {
        if (updatedMeals.length === 0) {
          // Delete plan record entirely if no meals remain
          await api.delete(`diets/${activeDayDiet.id}/`);
        } else {
          // Update plan record with remaining meals
          await api.put(`diets/${activeDayDiet.id}/`, {
            member: parseInt(selectedMember),
            day_of_week: activeDay,
            meals: updatedMeals
          });
        }
        fetchDiets(selectedMember);
      } catch (err) {
        console.error(err);
        alert('Failed to delete meal.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Nutrition & Diet Plans
        </h1>
        <p className="text-slate-400 text-sm mt-1">Design customized daily meals, calorie guidelines, and protein intake targets.</p>
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
              <h3 className="text-lg font-bold text-slate-200">Add Meal to {activeDay}</h3>
              <form onSubmit={handleAddMeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meal Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 08:30 AM"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Food items & Details</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. 4 boiled egg whites + 1 whole egg + 50g oatmeal with milk"
                    value={mealFood}
                    onChange={(e) => setMealFood(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Calories (kcal)</label>
                    <input
                      type="number"
                      placeholder="450"
                      value={mealCalories}
                      onChange={(e) => setMealCalories(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Protein (g)</label>
                    <input
                      type="text"
                      placeholder="35g"
                      value={mealProtein}
                      onChange={(e) => setMealProtein(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-slate-500 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#ce5a8c] hover:bg-[#be4879] text-[#0c0c0c] font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Meal'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Weekly Meal Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Days Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 border-b border-[var(--border-primary)]">
            {daysOfWeek.map(day => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  activeDay === day 
                    ? 'bg-[#ce5a8c] text-[#0c0c0c]' 
                    : 'text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-sidebar-link)]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-sm text-slate-500">Loading diet plan...</div>
          ) : mealList.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-pink-500/10 rounded-full text-[#ce5a8c]">
                <Coffee size={28} />
              </div>
              <h4 className="text-md font-bold text-slate-300">No Meals Logged for {activeDay}</h4>
              <p className="text-xs text-slate-500 max-w-sm">Define dynamic diet items, times, and nutritional calorie goals for client nutrition coaching.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mealList.map((meal, idx) => (
                <div key={idx} className="glass-card p-4 rounded-xl flex justify-between items-center border border-[var(--border-primary)]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-500/10 rounded-lg text-[#ce5a8c]">
                      <Coffee size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{meal.time}</h4>
                      <p className="text-sm text-slate-300 mt-1">{meal.food}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Calories: {meal.calories} kcal • Protein: {meal.protein}</p>
                    </div>
                  </div>
                  {canModify && (
                    <button
                      onClick={() => handleDeleteMeal(idx)}
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

export default DietPlans;
