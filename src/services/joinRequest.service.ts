import api from './api';

export const getJoinRequests = async () => {
  const response = await api.get('/api/agency-join-requests/my-agency/join-requests');
  return response.data;
};

export const approveJoinRequest = async (id: number) => {
  await api.patch(`/api/agency-join-requests/join-request/${id}/approve`);
};

export const rejectJoinRequest = async (id: number) => {
  await api.patch(`/api/agency-join-requests/join-request/${id}/reject`);
}; 