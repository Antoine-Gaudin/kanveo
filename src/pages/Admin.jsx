// src/pages/Admin.jsx
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdminUsers, useAdminInfluencerCodes, useAdminReferrals, useAdminCommissions, useAdminAffiliates } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { useConfirm } from '@/hooks/useConfirm';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

import AdminUserList from '@/components/admin/AdminUserList';
import AdminCodeList from '@/components/admin/AdminCodeList';
import AdminReferrals from '@/components/admin/AdminReferrals';
import AdminCommissions from '@/components/admin/AdminCommissions';
import AdminAffiliates from '@/components/admin/AdminAffiliates';
import CodeFormModal from '@/components/admin/CodeFormModal';
import FeedbackList from '@/components/feedback/FeedbackList';

import { createConnectAccount } from '@/services/stripeService';
import { FeedbackService } from '@/services/feedbackService';

import { ShieldCheck, Users, Tag, TrendingUp, Wallet, Handshake, MessageSquare } from 'lucide-react';

export default function Admin() {
  const { isAdmin } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm();

  // Hooks data — TOUJOURS appelés avant tout return conditionnel (Rules of Hooks)
  const { users, loading: usersLoading, updateUserRole } = useAdminUsers();
  const { codes, loading: codesLoading, createCode, updateCode, toggleCode, deleteCode } = useAdminInfluencerCodes();
  const { referrals, stats, loading: referralsLoading, createReferral } = useAdminReferrals();
  const { commissions, stats: commissionStats, loading: commissionsLoading, retryCommission } = useAdminCommissions();
  const { affiliates, affiliateReferrals, stats: affiliateStats, loading: affiliatesLoading, updateReferralStatus, toggleAffiliate } = useAdminAffiliates();

  // Tab
  const [activeTab, setActiveTab] = useState('users');

  // Modal state — AVANT le guard (Rules of Hooks)
  const [codeModal, setCodeModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);

  // Feedback state
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    setFeedbackLoading(true);
    FeedbackService.getAllFeedback()
      .then(setFeedbacks)
      .catch(() => {})
      .finally(() => setFeedbackLoading(false));
  }, []);

  // Guard admin — après tous les hooks
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // ═══════════════════════════════════════
  // USERS handlers
  // ═══════════════════════════════════════
  const handleUpdateRole = async (userId, roleLevel) => {
    try {
      await updateUserRole(userId, roleLevel);
      addToast('Rôle mis à jour', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // CODES handlers
  // ═══════════════════════════════════════
  const handleAddCode = () => {
    setEditingCode(null);
    setCodeModal(true);
  };

  const handleEditCode = (code) => {
    setEditingCode(code);
    setCodeModal(true);
  };

  const handleSaveCode = async (form) => {
    try {
      if (editingCode) {
        await updateCode(editingCode.id, form);
        addToast('Code modifié', 'success');
      } else {
        await createCode(form);
        addToast('Code créé', 'success');
      }
      setCodeModal(false);
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
      throw err;
    }
  };

  const handleToggleCode = async (codeId, isActive) => {
    try {
      await toggleCode(codeId, isActive);
      addToast(isActive ? 'Code activé' : 'Code désactivé', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleDeleteCode = async (codeId) => {
    try {
      await deleteCode(codeId);
      addToast('Code supprimé', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // REFERRALS handlers
  // ═══════════════════════════════════════
  const handleCreateReferral = async ({ user_id, influencer_code_id }) => {
    try {
      await createReferral({ user_id, influencer_code_id });
      addToast('Parrainage enregistré', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
      throw err;
    }
  };

  // ═══════════════════════════════════════
  // CONNECT & COMMISSIONS handlers
  // ═══════════════════════════════════════
  const handleGenerateOnboarding = async (codeId) => {
    try {
      const { onboarding_url } = await createConnectAccount(codeId);
      await navigator.clipboard.writeText(onboarding_url);
      addToast('Lien onboarding copié dans le presse-papier', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleRetryCommission = async (commissionId) => {
    try {
      await retryCommission(commissionId);
      addToast('Commission remise en attente', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // AFFILIATES handlers
  // ═══════════════════════════════════════
  const handleUpdateReferralStatus = async (referralId, status) => {
    try {
      await updateReferralStatus(referralId, status);
      addToast('Statut mis à jour', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleToggleAffiliate = async (affiliateId, isActive) => {
    try {
      await toggleAffiliate(affiliateId, isActive);
      addToast(isActive ? 'Partenaire activé' : 'Partenaire désactivé', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  // ═══════════════════════════════════════
  // FEEDBACK handlers
  // ═══════════════════════════════════════
  const handleUpdateFeedbackStatus = async (feedbackId, status, adminNotes) => {
    try {
      const updated = await FeedbackService.updateFeedbackStatus(feedbackId, status, adminNotes);
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? updated : f));
      addToast('Feedback mis à jour', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await FeedbackService.deleteFeedback(feedbackId);
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      addToast('Feedback supprimé', 'success');
    } catch (err) {
      addToast('Erreur : ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Administration
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les utilisateurs, codes influenceurs, parrainages et commissions
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="codes" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">Codes</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Parrainages</span>
          </TabsTrigger>
          <TabsTrigger value="commissions" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Commissions</span>
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="gap-1.5 text-xs sm:text-sm">
            <Handshake className="h-4 w-4" />
            <span className="hidden sm:inline">Partenaires</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Feedback</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <AdminUserList
            users={users}
            loading={usersLoading}
            onUpdateRole={handleUpdateRole}
            onConfirm={confirm}
          />
        </TabsContent>

        <TabsContent value="codes" className="mt-6">
          <AdminCodeList
            codes={codes}
            loading={codesLoading}
            onAdd={handleAddCode}
            onEdit={handleEditCode}
            onToggle={handleToggleCode}
            onDelete={handleDeleteCode}
            onGenerateOnboarding={handleGenerateOnboarding}
            onConfirm={confirm}
          />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <AdminReferrals
            referrals={referrals}
            stats={stats}
            loading={referralsLoading}
            users={users}
            codes={codes}
            onCreateReferral={handleCreateReferral}
            addToast={addToast}
          />
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <AdminCommissions
            commissions={commissions}
            stats={commissionStats}
            loading={commissionsLoading}
            onRetryCommission={handleRetryCommission}
            onConfirm={confirm}
          />
        </TabsContent>

        <TabsContent value="affiliates" className="mt-6">
          <AdminAffiliates
            affiliates={affiliates}
            affiliateReferrals={affiliateReferrals}
            stats={affiliateStats}
            loading={affiliatesLoading}
            onUpdateReferralStatus={handleUpdateReferralStatus}
            onToggleAffiliate={handleToggleAffiliate}
            onConfirm={confirm}
            addToast={addToast}
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackList
            feedbacks={feedbacks}
            loading={feedbackLoading}
            onUpdateStatus={handleUpdateFeedbackStatus}
            onDelete={handleDeleteFeedback}
            onConfirm={confirm}
            isAdmin={true}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CodeFormModal
        open={codeModal}
        onOpenChange={setCodeModal}
        onSave={handleSaveCode}
        code={editingCode}
      />

      {/* Toast + Confirm */}
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
    </div>
  );
}
