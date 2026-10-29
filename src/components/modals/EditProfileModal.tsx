import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useUser } from '../../context/UserContext';
import { useToast } from '../../context/ToastContext';
import { Upload, X, Camera, Lock, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUser } = useUser();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English (UK)');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name);
      setDisplayName(currentUser.displayName || currentUser.name);
      setPhone(currentUser.phone || '');
      setJobTitle(currentUser.jobTitle || '');
      setPreferredLanguage(currentUser.preferredLanguage || 'English (UK)');
      setAvatarPreview(currentUser?.avatarUrl || null);
      setError(null);
    }
  }, [isOpen, currentUser]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File', 'Please select a valid image file (PNG, JPEG, or WebP).', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('File Too Large', 'Avatar image must be under 2 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await updateCurrentUser({
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        preferredLanguage,
        ...(avatarPreview ? { avatarUrl: avatarPreview } : {}),
      });

      setIsSaving(false);
      if (res.success) {
        showToast('Profile Updated', 'Your personal account profile has been updated.', 'success');
        onClose();
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setIsSaving(false);
      setError(err?.message || 'Failed to update profile.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Personal Profile"
      description="Update your contact details, display name, and avatar picture"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Avatar Upload Area */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#161c19] border border-slate-200 dark:border-neutral-800">
          <div className="relative group">
            <img
              src={
                avatarPreview ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
              }
              alt="Avatar preview"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#167a53]/30"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Change photo"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-neutral-100">
              Profile Photo
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              PNG, JPG, or WebP up to 2 MB. Square aspect ratio recommended.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload Photo
              </Button>
              {avatarPreview && avatarPreview !== currentUser?.avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatarPreview(currentUser?.avatarUrl || null)}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Identity Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Legal Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Rashid Al-Zaid"
          />
          <Input
            label="Display Name / Short Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Rashid"
            helperText="Shown in header and comments"
          />
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+94 77 123 4567"
          />
          <Input
            label="Job Title / Designation"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Managing Director"
          />
        </div>

        {/* Language Selection */}
        <Select
          label="Preferred Language"
          value={preferredLanguage}
          onChange={(e) => setPreferredLanguage(e.target.value)}
          options={[
            { value: 'English (UK)', label: 'English (United Kingdom / Commonwealth)' },
            { value: 'English (US)', label: 'English (United States)' },
            { value: 'Sinhala', label: 'සිංහල (Sinhala)' },
            { value: 'Tamil', label: 'தமிழ் (Tamil)' },
            { value: 'Arabic', label: 'العربية (Arabic)' },
          ]}
        />

        {/* Read-Only Protected Fields */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151b18] border border-slate-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Email Address:</span>
            </span>
            <span className="font-semibold text-slate-800 dark:text-neutral-200 font-mono text-[11px]">
              {currentUser?.email || 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Enterprise Role:</span>
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {currentUser?.role || 'Guest'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 pt-1 leading-normal border-t border-slate-200/50 dark:border-neutral-800">
            * Role permissions and email updates require administrator verification or provider re-authentication.
          </p>
        </div>
      </form>
    </Dialog>
  );
};
