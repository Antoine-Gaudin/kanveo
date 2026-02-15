// src/hooks/useAdmin.js
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '../services/adminService';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const EMPTY = [];

// ═══════════════════════════════════════
// Hook Utilisateurs admin
// ═══════════════════════════════════════
export function useAdminUsers() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['admin', 'users'];

  const { data: users = EMPTY, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => AdminService.getAllUsers(),
    enabled: !!user?.id,
  });

  const error = queryError?.message || null;

  const updateUserRole = async (userId, roleLevel) => {
    const updated = await AdminService.updateUserRole(userId, roleLevel);
    qc.setQueryData(queryKey, (old) =>
      old?.map(u => u.id === userId ? updated : u) || []
    );
    return updated;
  };

  return { users, loading, error, updateUserRole };
}

// ═══════════════════════════════════════
// Hook Codes Influenceurs admin
// ═══════════════════════════════════════
export function useAdminInfluencerCodes() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['admin', 'influencerCodes'];

  const { data: codes = EMPTY, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => AdminService.getAllInfluencerCodes(),
    enabled: !!user?.id,
  });

  const error = queryError?.message || null;

  const createCode = async (codeData) => {
    const newCode = await AdminService.createInfluencerCode(codeData);
    qc.setQueryData(queryKey, (old) => [newCode, ...(old || [])]);
    return newCode;
  };

  const updateCode = async (codeId, updates) => {
    const updated = await AdminService.updateInfluencerCode(codeId, updates);
    qc.setQueryData(queryKey, (old) =>
      old?.map(c => c.id === codeId ? updated : c) || []
    );
    return updated;
  };

  const toggleCode = async (codeId, isActive) => {
    const updated = await AdminService.toggleInfluencerCode(codeId, isActive);
    qc.setQueryData(queryKey, (old) =>
      old?.map(c => c.id === codeId ? updated : c) || []
    );
    return updated;
  };

  const deleteCode = async (codeId) => {
    await AdminService.deleteInfluencerCode(codeId);
    qc.setQueryData(queryKey, (old) =>
      old?.filter(c => c.id !== codeId) || []
    );
  };

  return { codes, loading, error, createCode, updateCode, toggleCode, deleteCode };
}

// ═══════════════════════════════════════
// Hook Referrals (Parrainages) admin
// ═══════════════════════════════════════
export function useAdminReferrals() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['admin', 'referrals'];

  const { data: referrals = EMPTY, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => AdminService.getAllReferrals(),
    enabled: !!user?.id,
  });

  const error = queryError?.message || null;

  const stats = useMemo(
    () => AdminService.computeInfluencerStats(referrals),
    [referrals]
  );

  const createReferral = async ({ user_id, influencer_code_id }) => {
    const newReferral = await AdminService.createReferral({ user_id, influencer_code_id });
    qc.setQueryData(queryKey, (old) => [newReferral, ...(old || [])]);
    return newReferral;
  };

  return { referrals, stats, loading, error, createReferral };
}

// ═══════════════════════════════════════
// Hook Partenaires Affilies admin
// ═══════════════════════════════════════
export function useAdminAffiliates() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKeyAff = ['admin', 'affiliates'];
  const queryKeyRef = ['admin', 'affiliateReferrals'];

  const { data: affiliates = EMPTY, isLoading: loadingAff, error: errAff } = useQuery({
    queryKey: queryKeyAff,
    queryFn: () => AdminService.getAllAffiliates(),
    enabled: !!user?.id,
  });

  const { data: affiliateReferrals = EMPTY, isLoading: loadingRef, error: errRef } = useQuery({
    queryKey: queryKeyRef,
    queryFn: () => AdminService.getAllAffiliateReferrals(),
    enabled: !!user?.id,
  });

  const loading = loadingAff || loadingRef;
  const error = errAff?.message || errRef?.message || null;

  const stats = useMemo(
    () => AdminService.computeAffiliateStats(affiliates, affiliateReferrals),
    [affiliates, affiliateReferrals]
  );

  const updateReferralStatus = async (referralId, status) => {
    const updated = await AdminService.updateAffiliateReferralStatus(referralId, status);
    qc.setQueryData(queryKeyRef, (old) =>
      old?.map(r => r.id === referralId ? updated : r) || []
    );
    return updated;
  };

  const toggleAffiliate = async (affiliateId, isActive) => {
    const updated = await AdminService.toggleAffiliate(affiliateId, isActive);
    qc.setQueryData(queryKeyAff, (old) =>
      old?.map(a => a.id === affiliateId ? updated : a) || []
    );
    return updated;
  };

  return { affiliates, affiliateReferrals, stats, loading, error, updateReferralStatus, toggleAffiliate };
}

// ═══════════════════════════════════════
// Hook Commissions Affilies admin
// ═══════════════════════════════════════
export function useAdminCommissions() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['admin', 'commissions'];

  const { data: commissions = EMPTY, isLoading: loading, error: queryError } = useQuery({
    queryKey,
    queryFn: () => AdminService.getAllCommissions(),
    enabled: !!user?.id,
  });

  const error = queryError?.message || null;

  const stats = useMemo(
    () => AdminService.computeCommissionStats(commissions),
    [commissions]
  );

  const retryCommission = async (commissionId) => {
    const updated = await AdminService.retryFailedCommission(commissionId);
    qc.setQueryData(queryKey, (old) =>
      old?.map(c => c.id === commissionId ? { ...c, ...updated } : c) || []
    );
    return updated;
  };

  return { commissions, stats, loading, error, retryCommission };
}
