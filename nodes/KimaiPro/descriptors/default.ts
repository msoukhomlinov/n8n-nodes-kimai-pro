import type { INodeProperties } from 'n8n-workflow';
import type { ResourceDescriptor } from './types';

const resource = 'default';

export const defaultDescriptor: ResourceDescriptor = {
	resource,
	defaultOperation: 'ping',
	operations: [
		{
			name: 'Get Timesheet Config',
			value: 'getTimesheetConfig',
			action: 'Get timesheet configuration',
			routing: {
				request: {
					method: 'GET',
					url: '/api/config/timesheet',
				},
			},
		},
		{
			name: 'Get Colors',
			value: 'getColors',
			action: 'Get configured color codes',
			routing: {
				request: {
					method: 'GET',
					url: '/api/config/colors',
				},
			},
		},
		{
			name: 'Ping',
			value: 'ping',
			action: 'Test API connection',
			routing: {
				request: {
					method: 'GET',
					url: '/api/ping',
				},
			},
		},
		{
			name: 'Get Version',
			value: 'getVersion',
			action: 'Get Kimai version',
			routing: {
				request: {
					method: 'GET',
					url: '/api/version',
				},
			},
		},
		{
			name: 'Get Plugins',
			value: 'getPlugins',
			action: 'Get installed plugins',
			routing: {
				request: {
					method: 'GET',
					url: '/api/plugins',
				},
			},
		},
		{
			name: 'Get Next Week',
			value: 'getNextWeek',
			action: 'Get next week approval bundle',
			routing: {
				request: {
					method: 'GET',
					url: '/api/approval-bundle/next-week',
					qs: {
						user: '={{$parameter["userId"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Get Overtime Year',
			value: 'getOvertimeYear',
			action: 'Get overtime year',
			routing: {
				request: {
					method: 'GET',
					url: '/api/approval-bundle/overtime_year',
					qs: {
						user: '={{$parameter["userId"] || undefined}}',
						date: '={{$parameter["date"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Get Week Status',
			value: 'getWeekStatus',
			action: 'Get week status',
			routing: {
				request: {
					method: 'GET',
					url: '/api/approval-bundle/week-status',
					qs: {
						user: '={{$parameter["userId"] || undefined}}',
						date: '={{$parameter["date"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Get Weekly Overtime',
			value: 'getWeeklyOvertime',
			action: 'Get weekly overtime',
			routing: {
				request: {
					method: 'GET',
					url: '/api/approval-bundle/weekly_overtime',
					qs: {
						user: '={{$parameter["userId"] || undefined}}',
						date: '={{$parameter["date"] || undefined}}',
					},
				},
			},
		},
		{
			name: 'Add to Approve',
			value: 'addToApprove',
			action: 'Add timesheet to approve',
			routing: {
				request: {
					method: 'POST',
					url: '/api/approval-bundle/add_to_approve',
					qs: {
						user: '={{$parameter["userId"] || undefined}}',
						date: '={{$parameter["date"] || undefined}}',
					},
				},
			},
		},
	],
	parameters: [
		{
			displayName: 'User ID',
			name: 'userId',
			type: 'options',
			typeOptions: {
				loadOptionsMethod: 'getUsers',
			},
			description: 'User ID to get approval data for',
			displayOptions: {
				show: {
					resource: [resource],
					operation: [
						'addToApprove',
						'getNextWeek',
						'getOvertimeYear',
						'getWeekStatus',
						'getWeeklyOvertime',
					],
				},
			},
			default: '',
		},
		{
			displayName: 'Date',
			name: 'date',
			type: 'string',
			typeOptions: {
				dateFormat: 'YYYY-MM-DD',
			},
			description: 'Date for approval data (YYYY-MM-DD)',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['addToApprove', 'getOvertimeYear', 'getWeekStatus', 'getWeeklyOvertime'],
				},
			},
			default: '',
		},
	],
};
