// SDK wrapper for Kimai API using node-kimai
// Provides typed methods mapped to n8n node operations

import { ApiClient } from 'node-kimai';

interface KimaiSdkOptions {
  apiUrl: string;
  apiToken: string;
}

/**
 * Wrapper around node-kimai ApiClient that provides methods
 * matching the n8n node's resource+operation structure.
 */
export class KimaiSdk {
  public client: ApiClient;

  constructor(options: KimaiSdkOptions) {
    this.client = new ApiClient({
      baseUrl: options.apiUrl.replace(/\/+$/, ''),
      token: options.apiToken,
    });
  }

  // ==================== Activities ====================

  async activitiesList(params: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (params.project) query.project = params.project;
    if (params.visible) query.visible = params.visible;
    if (params.globals !== undefined) query.globals = params.globals ? '1' : '0';
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.order) query.order = params.order;
    if (params.term) query.term = params.term;
    if (params.projects) {
      // Handle comma-separated projects[]
      const projects = Array.isArray(params.projects)
        ? params.projects
        : String(params.projects).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (projects.length > 0) query.projects = projects;
    }
    return this.client.activities.list(query);
  }

  async activitiesGetById(id: number): Promise<any> {
    return this.client.activities.getById(id);
  }

  async activitiesCreate(data: Record<string, any>): Promise<any> {
    return this.client.activities.create(data as any);
  }

  async activitiesUpdate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.activities.update(id, data as any);
  }

  async activitiesDelete(id: number): Promise<void> {
    return this.client.activities.delete(id);
  }

  async activitiesUpdateMeta(id: number, meta: Record<string, any>): Promise<any> {
    return this.client.activities.updateMeta(id, meta);
  }

  async activitiesGetRates(id: number): Promise<any[]> {
    return this.client.activities.getRates(id);
  }

  async activitiesCreateRate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.activities.createRate(id, data as any);
  }

  async activitiesDeleteRate(id: number, rateId: number): Promise<void> {
    return this.client.activities.deleteRate(id, rateId);
  }

  async activitiesAddToTeam(id: number): Promise<any> {
    return this.client.activities.addToTeam(id, {});
  }

  // ==================== Customers ====================

  async customersList(params: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (params.visible) query.visible = params.visible;
    if (params.order) query.order = params.order;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.term) query.term = params.term;
    if (params.full) query.full = params.full;
    return this.client.customers.list(query);
  }

  async customersGetById(id: number): Promise<any> {
    return this.client.customers.getById(id);
  }

  async customersCreate(data: Record<string, any>): Promise<any> {
    return this.client.customers.create(data as any);
  }

  async customersUpdate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.customers.update(id, data as any);
  }

  async customersDelete(id: number): Promise<void> {
    return this.client.customers.delete(id);
  }

  async customersUpdateMeta(id: number, meta: Record<string, any>): Promise<any> {
    return this.client.customers.updateMeta(id, meta);
  }

  async customersGetRates(id: number): Promise<any[]> {
    return this.client.customers.getRates(id);
  }

  async customersCreateRate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.customers.createRate(id, data as any);
  }

  async customersDeleteRate(id: number, rateId: number): Promise<void> {
    return this.client.customers.deleteRate(id, rateId);
  }

  async customersListComments(id: number): Promise<any[]> {
    return this.client.customers.listComments(id);
  }

  async customersCreateComment(id: number, data: Record<string, any>): Promise<any> {
    return this.client.customers.createComment(id, data as any);
  }

  async customersDeleteComment(id: number, commentId: number): Promise<void> {
    return this.client.customers.deleteComment(id, commentId);
  }

  async customersPinComment(id: number, commentId: number): Promise<any> {
    return this.client.customers.pinComment(id, commentId);
  }

  async customersAddToTeam(id: number): Promise<any> {
    return this.client.customers.addToTeam(id, {});
  }

  // ==================== Projects ====================

  async projectsList(params: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (params.customers) {
      // Handle comma-separated customers[]
      const customers = Array.isArray(params.customers)
        ? params.customers
        : String(params.customers).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (customers.length > 0) query.customers = customers;
    }
    if (params.visible) query.visible = params.visible;
    if (params.start) query.start = params.start;
    if (params.end) query.end = params.end;
    if (params.globalActivities !== undefined) query.globalActivities = params.globalActivities;
    if (params.order) query.order = params.order;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.term) query.term = params.term;
    if (params.ignoreDates) query.ignoreDates = params.ignoreDates;
    return this.client.projects.list(query);
  }

  async projectsGetById(id: number): Promise<any> {
    return this.client.projects.getById(id);
  }

  async projectsCreate(data: Record<string, any>): Promise<any> {
    return this.client.projects.create(data as any);
  }

  async projectsUpdate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.projects.update(id, data as any);
  }

  async projectsDelete(id: number): Promise<void> {
    return this.client.projects.delete(id);
  }

  async projectsUpdateMeta(id: number, meta: Record<string, any>): Promise<any> {
    return this.client.projects.updateMeta(id, meta);
  }

  async projectsGetRates(id: number): Promise<any[]> {
    return this.client.projects.getRates(id);
  }

  async projectsCreateRate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.projects.createRate(id, data as any);
  }

  async projectsDeleteRate(id: number, rateId: number): Promise<void> {
    return this.client.projects.deleteRate(id, rateId);
  }

  async projectsListComments(id: number): Promise<any[]> {
    return this.client.projects.listComments(id);
  }

  async projectsCreateComment(id: number, data: Record<string, any>): Promise<any> {
    return this.client.projects.createComment(id, data as any);
  }

  async projectsDeleteComment(id: number, commentId: number): Promise<void> {
    return this.client.projects.deleteComment(id, commentId);
  }

  async projectsPinComment(id: number, commentId: number): Promise<any> {
    return this.client.projects.pinComment(id, commentId);
  }

  async projectsAddToTeam(id: number): Promise<any> {
    return this.client.projects.addToTeam(id, {});
  }

  // ==================== Timesheets ====================

  async timesheetsList(params: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};

    // Handle user/userFilter - use user for single user, users[] for multiple
    if (params.users && String(params.users).trim() !== '') {
      const users = String(params.users).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (users.length > 0) query.users = users;
    } else if (params.userFilter) {
      query.user = params.userFilter;
    }

    if (params.customer) query.customer = params.customer;
    if (params.customers) {
      const customers = Array.isArray(params.customers)
        ? params.customers
        : String(params.customers).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (customers.length > 0) query.customers = customers;
    }
    if (params.project) query.project = params.project;
    if (params.projects) {
      const projects = Array.isArray(params.projects)
        ? params.projects
        : String(params.projects).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (projects.length > 0) query.projects = projects;
    }
    if (params.activity) query.activity = params.activity;
    if (params.activities) {
      const activities = Array.isArray(params.activities)
        ? params.activities
        : String(params.activities).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (activities.length > 0) query.activities = activities;
    }
    if (params.page) query.page = params.page;
    if (params.size) query.size = params.size;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.order) query.order = params.order;
    if (params.begin) query.begin = params.begin;
    if (params.end) query.end = params.end;
    if (params.exported) query.exported = params.exported;
    if (params.active) query.active = params.active;
    if (params.billable) query.billable = params.billable;
    if (params.full) query.full = params.full ? '1' : '0';
    if (params.term) query.term = params.term;
    if (params.modifiedAfter) query.modified_after = params.modifiedAfter;
    if (params.tags) {
      const tags = Array.isArray(params.tags)
        ? params.tags
        : Object.keys(params.tags);
      if (tags.length > 0) query.tags = tags;
    }

    return this.client.timesheets.list(query);
  }

  async timesheetsGetById(id: number): Promise<any> {
    return this.client.timesheets.getById(id);
  }

  async timesheetsCreate(data: Record<string, any>, full: boolean = false): Promise<any> {
    const query: Record<string, string> = {};
    if (full) query.full = '1';
    // Use raw POST with query param for full response
    return this.client.post<any>(`/api/timesheets${full ? '?full=1' : ''}`, { body: data });
  }

  async timesheetsUpdate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.timesheets.update(id, data);
  }

  async timesheetsDelete(id: number): Promise<void> {
    return this.client.timesheets.delete(id);
  }

  async timesheetsStop(id: number): Promise<any> {
    return this.client.timesheets.stop(id);
  }

  async timesheetsRestart(id: number, data: Record<string, any>): Promise<any> {
    return this.client.timesheets.restart(id, data);
  }

  async timesheetsDuplicate(id: number): Promise<any> {
    return this.client.timesheets.duplicate(id);
  }

  async timesheetsToggleExport(id: number): Promise<any> {
    return this.client.timesheets.toggleExport(id);
  }

  async timesheetsUpdateMeta(id: number, meta: Record<string, any>): Promise<any> {
    return this.client.timesheets.updateMeta(id, meta);
  }

  async timesheetsGetActive(): Promise<any[]> {
    return this.client.timesheets.getActive();
  }

  async timesheetsGetRecent(params: Record<string, any> = {}): Promise<any[]> {
    return this.client.timesheets.getRecent({
      begin: params.begin,
      size: params.size,
    });
  }

  // ==================== Users ====================

  async usersList(params: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (params.visible) query.visible = params.visible;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.order) query.order = params.order;
    if (params.term) query.term = params.term;
    if (params.full) query.full = params.full;
    return this.client.users.list(query);
  }

  async usersGetById(id: number): Promise<any> {
    return this.client.users.getById(id);
  }

  async usersGetMe(): Promise<any> {
    return this.client.users.getMe();
  }

  async usersCreate(data: Record<string, any>): Promise<any> {
    return this.client.users.create(data as any);
  }

  async usersUpdate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.users.update(id, data);
  }

  async usersUpdatePreferences(id: number, prefs: Record<string, any>[]): Promise<any> {
    return this.client.users.updatePreferences(id, prefs as any);
  }

  async usersDeleteApiToken(tokenId: number): Promise<void> {
    return this.client.users.deleteApiToken(tokenId);
  }

  // ==================== Tags ====================

  async tagsList(params: Record<string, any> = {}): Promise<any[]> {
    if (params.name) {
      return this.client.tags.find(params.name);
    }
    return this.client.tags.list();
  }

  async tagsCreate(data: Record<string, any>): Promise<any> {
    return this.client.tags.create(data as any);
  }

  async tagsDelete(id: number): Promise<void> {
    return this.client.tags.delete(id);
  }

  // ==================== Teams ====================

  async teamsList(): Promise<any[]> {
    return this.client.teams.list();
  }

  async teamsGetById(id: number): Promise<any> {
    return this.client.teams.getById(id);
  }

  async teamsCreate(data: Record<string, any>): Promise<any> {
    return this.client.teams.create(data as any);
  }

  async teamsUpdate(id: number, data: Record<string, any>): Promise<any> {
    return this.client.teams.update(id, data as any);
  }

  async teamsDelete(id: number): Promise<void> {
    return this.client.teams.delete(id);
  }

  async teamsAddMember(teamId: number, userId: number): Promise<any> {
    return this.client.teams.addMember(teamId, userId);
  }

  async teamsRemoveMember(teamId: number, userId: number): Promise<void> {
    return this.client.teams.removeMember(teamId, userId);
  }

  async teamsGrantCustomerAccess(teamId: number, customerId: number): Promise<any> {
    return this.client.teams.grantCustomerAccess(teamId, customerId);
  }

  async teamsRevokeCustomerAccess(teamId: number, customerId: number): Promise<void> {
    return this.client.teams.revokeCustomerAccess(teamId, customerId);
  }

  async teamsGrantProjectAccess(teamId: number, projectId: number): Promise<any> {
    return this.client.teams.grantProjectAccess(teamId, projectId);
  }

  async teamsRevokeProjectAccess(teamId: number, projectId: number): Promise<void> {
    return this.client.teams.revokeProjectAccess(teamId, projectId);
  }

  async teamsGrantActivityAccess(teamId: number, activityId: number): Promise<any> {
    return this.client.teams.grantActivityAccess(teamId, activityId);
  }

  async teamsRevokeActivityAccess(teamId: number, activityId: number): Promise<void> {
    return this.client.teams.revokeActivityAccess(teamId, activityId);
  }

  // ==================== Invoices ====================

  async invoicesList(params: Record<string, any> = {}): Promise<any[]> {
    const query: Record<string, any> = {};
    if (params.begin) query.begin = params.begin;
    if (params.end) query.end = params.end;
    if (params.customers) {
      const customers = Array.isArray(params.customers)
        ? params.customers
        : Object.keys(params.customers);
      if (customers.length > 0) query.customers = customers;
    }
    if (params.status) {
      const statuses = String(params.status).split(',').map((v: string) => v.trim()).filter(Boolean);
      if (statuses.length > 0) query.status = statuses;
    }
    if (params.page) query.page = params.page;
    if (params.size) query.size = params.size;
    return this.client.invoices.list(query);
  }

  async invoicesGetById(id: number): Promise<any> {
    return this.client.invoices.getById(id);
  }

  async invoicesUpdateCustomFields(id: number, fields: Record<string, any>[]): Promise<any> {
    return this.client.invoices.updateCustomFields(id, fields as any);
  }

  async invoicesDownload(id: number): Promise<ArrayBuffer> {
    return this.client.invoices.download(id);
  }

  // ==================== System/Default ====================

  async pingRaw(): Promise<any[]> {
    return this.client.system.pingRaw();
  }

  async getVersion(): Promise<any> {
    return this.client.system.getVersion();
  }

  async getPlugins(): Promise<any[]> {
    return this.client.system.getPlugins();
  }

  async getTimesheetConfig(): Promise<any> {
    return this.client.config.getTimesheetConfig();
  }

  async getColors(): Promise<Record<string, string>> {
    return this.client.config.getColors();
  }

  async nextWeek(params: Record<string, any> = {}): Promise<any> {
    return this.client.approvalBundle.nextWeek({ user: params.user });
  }

  async overtimeYear(params: Record<string, any>): Promise<any> {
    return this.client.approvalBundle.overtimeYear({ user: params.user, date: params.date });
  }

  async weekStatus(params: Record<string, any>): Promise<any> {
    return this.client.approvalBundle.weekStatus({ user: params.user, date: params.date });
  }

  async weeklyOvertime(params: Record<string, any>): Promise<any[]> {
    return this.client.approvalBundle.weeklyOvertime({ user: params.user, date: params.date });
  }

  async addToApprove(params: Record<string, any>): Promise<string> {
    return this.client.approvalBundle.addToApprove({ user: params.user, date: params.date });
  }
}
