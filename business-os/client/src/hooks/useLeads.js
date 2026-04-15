import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/client';

export function useLeads(params = {}) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.getAll(params).then((r) => r.data),
  });
}

export function useLead(id) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useLeadNotes(id) {
  return useQuery({
    queryKey: ['leads', id, 'notes'],
    queryFn: () => leadsApi.getNotes(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useLeadActivity(id) {
  return useQuery({
    queryKey: ['leads', id, 'activity'],
    queryFn: () => leadsApi.getActivity(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => leadsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leadsApi.update(id, data).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
    },
  });
}

export function useMoveLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }) => leadsApi.move(id, stage).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => leadsApi.delete(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useAddLeadNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => leadsApi.addNote(id, content).then((r) => r.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads', id, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['leads', id, 'activity'] });
    },
  });
}
