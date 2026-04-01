'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
	Plus,
	Trash2,
	Clock,
	Loader2,
	Check,
	Download,
	FileText,
	ChevronDownIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
	formatCurrency,
	formatDurationShort,
	type Client,
	type DiscountType,
	type TimeEntryWithProject,
} from '@invoicer/shared';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FieldHint } from '@/components/ui/field-hint';
import { TimeEntryPicker } from './time-entry-picker';
import { useClients } from '@/hooks/use-clients';
import { useNextInvoiceNumber } from '@/hooks/use-next-invoice-number';
import { useUnbilledTime } from '@/hooks/use-unbilled-time';

interface LineItem {
	description: string;
	quantity: number;
	unitPrice: number;
	taxRate: number;
	timeEntryId?: string;
	sortOrder: number;
}

interface Discount {
	description: string;
	type: DiscountType;
	value: number;
}

interface InvoiceInitialData {
	invoiceNumber?: string;
	clientId: string;
	currency: string;
	issueDate: Date;
	dueDate: Date | null;
	notes: string | null;
	paymentTerms: string | null;
	lineItems: Array<{
		description: string;
		quantity: string | number;
		unitPrice: number;
		taxRate: string | number;
		timeEntryId: string | null;
		sortOrder: number;
	}>;
	discounts: Array<{
		description: string;
		type: string;
		value: string | number;
		amount: number;
	}>;
}

interface InvoiceFormProps {
	initialData?: InvoiceInitialData;
	invoiceId?: string;
	defaultClientId?: string;
}

function toDate(date: Date | string | null): Date | undefined {
	if (!date) return undefined;
	return new Date(date);
}

function calculateLineAmount(item: LineItem): number {
	return Math.round(item.quantity * item.unitPrice);
}

function calculateLineTax(item: LineItem): number {
	const amount = calculateLineAmount(item);
	return Math.round(amount * (item.taxRate / 100));
}

export function InvoiceForm({
	initialData,
	invoiceId,
	defaultClientId,
}: InvoiceFormProps) {
	const router = useRouter();
	const isEditing = !!invoiceId;

	const queryClient = useQueryClient();
	const { data: clients = [], isLoading: loadingClients } = useClients();
	const [submitting, setSubmitting] = useState(false);
	const [savingDraft, setSavingDraft] = useState(false);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [invoiceNumber, setInvoiceNumber] = useState(
		initialData?.invoiceNumber ?? ''
	);

	const [clientId, setClientId] = useState(
		initialData?.clientId ?? defaultClientId ?? ''
	);
	const [currency, setCurrency] = useState(initialData?.currency ?? 'EUR');
	const [issueDate, setIssueDate] = useState<Date | undefined>(
		toDate(initialData?.issueDate ?? new Date())
	);
	const [dueDate, setDueDate] = useState<Date | undefined>(
		toDate(initialData?.dueDate ?? null)
	);
	const [notes, setNotes] = useState(initialData?.notes ?? '');
	const [paymentTerms, setPaymentTerms] = useState(
		initialData?.paymentTerms ?? ''
	);

	const [lineItems, setLineItems] = useState<LineItem[]>(() => {
		if (initialData?.lineItems && initialData.lineItems.length > 0) {
			return initialData.lineItems.map((li) => ({
				description: li.description,
				quantity: Number(li.quantity),
				unitPrice: li.unitPrice,
				taxRate: Number(li.taxRate),
				timeEntryId: li.timeEntryId ?? undefined,
				sortOrder: li.sortOrder,
			}));
		}
		return [
			{
				description: '',
				quantity: 1,
				unitPrice: 0,
				taxRate: 0,
				sortOrder: 0,
			},
		];
	});

	const [discounts, setDiscounts] = useState<Discount[]>(() => {
		if (initialData?.discounts && initialData.discounts.length > 0) {
			return initialData.discounts.map((d) => ({
				description: d.description,
				type: d.type as DiscountType,
				value: Number(d.value),
			}));
		}
		return [];
	});

	// Fetch next invoice number for new invoices
	const { data: nextNumber } = useNextInvoiceNumber(!isEditing);
	useEffect(() => {
		if (nextNumber && !invoiceNumber) setInvoiceNumber(nextNumber);
	}, [nextNumber]); // eslint-disable-line react-hooks/exhaustive-deps

	// Unbilled time for selected client
	const { data: unbilledSeconds = 0 } = useUnbilledTime(clientId || null);

	// Calculations
	const subtotal = lineItems.reduce(
		(sum, item) => sum + calculateLineAmount(item),
		0
	);
	const taxTotal = lineItems.reduce(
		(sum, item) => sum + calculateLineTax(item),
		0
	);
	const discountTotal = discounts.reduce((sum, d) => {
		if (d.type === 'percentage')
			return sum + Math.round(subtotal * (d.value / 100));
		return sum + Math.round(d.value * 100);
	}, 0);
	const total = subtotal + taxTotal - discountTotal;

	// Compute a meaningful tax label from actual line items
	const uniqueTaxRates = [
		...new Set(lineItems.map((li) => li.taxRate).filter((r) => r > 0)),
	];
	const taxLabel =
		uniqueTaxRates.length === 1
			? `Tax (${uniqueTaxRates[0]}%)`
			: taxTotal > 0
				? 'Tax'
				: 'Tax (0%)';

	const addLineItem = () =>
		setLineItems((prev) => [
			...prev,
			{
				description: '',
				quantity: 1,
				unitPrice: 0,
				taxRate: 0,
				sortOrder: prev.length,
			},
		]);
	const removeLineItem = (index: number) => {
		if (lineItems.length <= 1) return;
		setLineItems((prev) => prev.filter((_, i) => i !== index));
	};
	const updateLineItem = (
		index: number,
		field: keyof LineItem,
		value: string | number
	) => {
		setLineItems((prev) =>
			prev.map((item, i) =>
				i === index ? { ...item, [field]: value } : item
			)
		);
	};

	const handlePickerSelect = useCallback(
		(entries: TimeEntryWithProject[]) => {
			const newItems: LineItem[] = entries.map((entry, idx) => {
				const hours = entry.duration ? entry.duration / 3600 : 0;
				const hourlyRate = entry.project?.hourlyRate ?? 0;
				return {
					description: entry.description
						? `${entry.project?.name ?? 'Project'} - ${entry.description}`
						: (entry.project?.name ?? 'Time entry'),
					quantity: Math.round(hours * 100) / 100,
					unitPrice: hourlyRate,
					taxRate: 0,
					timeEntryId: entry.id,
					sortOrder: lineItems.length + idx,
				};
			});
			setLineItems((prev) => {
				const existing =
					prev.length === 1 &&
					prev[0].description === '' &&
					prev[0].unitPrice === 0
						? []
						: prev;
				return [...existing, ...newItems];
			});
			queryClient.invalidateQueries({ queryKey: ["time-entries", "unbilled"] });
			toast.success(`Added ${newItems.length} time entries.`);
		},
		[lineItems.length]
	);

	const buildPayload = () => ({
		invoiceNumber: invoiceNumber || undefined,
		clientId,
		currency,
		issueDate: issueDate?.toISOString(),
		dueDate: dueDate?.toISOString(),
		notes: notes || undefined,
		paymentTerms: paymentTerms || undefined,
		lineItems: lineItems.map((li, idx) => ({
			description: li.description,
			quantity: li.quantity,
			unitPrice: li.unitPrice,
			taxRate: li.taxRate,
			timeEntryId: li.timeEntryId,
			sortOrder: idx,
		})),
		discounts:
			discounts.length > 0
				? discounts.map((d) => ({
						description: d.description,
						type: d.type,
						value: d.value,
					}))
				: undefined,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!clientId) {
			toast.error('Please select a client.');
			return;
		}
		if (lineItems.some((li) => !li.description)) {
			toast.error('All line items must have a description.');
			return;
		}
		setSubmitting(true);
		try {
			const res = await fetch(
				isEditing ? `/api/invoices/${invoiceId}` : '/api/invoices',
				{
					method: isEditing ? 'PATCH' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(buildPayload()),
				}
			);
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || 'Failed to save');
			}
			const data = await res.json();
			toast.success(isEditing ? 'Invoice updated.' : 'Invoice created.');
			router.push(`/invoices/${data.id ?? invoiceId}`);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save.');
		}
		setSubmitting(false);
	};

	const handleSaveDraft = async () => {
		if (!clientId) {
			toast.error('Please select a client.');
			return;
		}
		if (lineItems.some((li) => !li.description)) {
			toast.error('All line items must have a description.');
			return;
		}
		setSavingDraft(true);
		try {
			const res = await fetch(
				isEditing ? `/api/invoices/${invoiceId}` : '/api/invoices',
				{
					method: isEditing ? 'PATCH' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(buildPayload()),
				}
			);
			if (!res.ok) {
				const error = await res.json().catch(() => ({}));
				throw new Error(error.message || 'Failed to save');
			}
			const data = await res.json();
			toast.success('Draft saved.');
			router.push(`/invoices/${data.id ?? invoiceId}`);
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to save.');
		}
		setSavingDraft(false);
	};

	return (
		<form onSubmit={handleSubmit}>
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						{isEditing
							? `Edit Invoice ${invoiceNumber}`
							: 'New Invoice'}
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						{isEditing
							? 'Update invoice details.'
							: 'Create and send a new invoice to your client.'}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => router.back()}
						className="rounded-lg border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSaveDraft}
						disabled={savingDraft || submitting}
						className="rounded-lg border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
					>
						{savingDraft ? (
							<Loader2 className="h-4 w-4 animate-spin inline mr-1" />
						) : null}
						Save Draft
					</button>
					<button
						type="submit"
						disabled={submitting || savingDraft}
						className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] disabled:opacity-50"
					>
						{submitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Check className="h-4 w-4" />
						)}
						{isEditing ? 'Update Invoice' : 'Create Invoice'}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-6">
				{/* Left column */}
				<div className="col-span-2 space-y-6">
					{/* Invoice Details */}
					<div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
						<h2 className="mb-5 text-base font-semibold text-slate-900">
							Invoice Details
						</h2>
						<div className="grid grid-cols-3 gap-4 mb-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700">
									Invoice Number
								</label>
								<input
									value={invoiceNumber}
									onChange={(e) => setInvoiceNumber(e.target.value)}
									placeholder="INV-2026-0001"
									className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
								/>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700">
									Issue Date
								</label>
								<DatePicker
									value={issueDate}
									onChange={setIssueDate}
									placeholder="Select date"
								/>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700">
									Due Date
								</label>
								<DatePicker
									value={dueDate}
									onChange={setDueDate}
									placeholder="Select date"
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700">
									Client
								</label>
								{!loadingClients && clients.length === 0 ? (
									<FieldHint
										message="You need to add a client before creating an invoice."
										ctaLabel="Add Client"
										ctaHref="/clients/new"
									>
										<div className="flex w-full items-center justify-between rounded-lg border border-[#E8ECF1] bg-slate-50 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed opacity-60">
											<span>Select client</span>
											<ChevronDownIcon className="size-4 text-muted-foreground" />
										</div>
									</FieldHint>
								) : (
									<Select
										value={clientId || null}
										onValueChange={(val) => {
											if (val !== null) setClientId(val);
										}}
									>
										<SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
											<SelectValue placeholder="Select client">
												{(value) =>
													value
														? (clients.find(
																(c) =>
																	c.id ===
																	value
															)?.companyName ??
															value)
														: 'Select client'
												}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											{clients.map((c) => (
												<SelectItem
													key={c.id}
													value={c.id}
												>
													{c.companyName}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-700">
									Currency
								</label>
								<Select
									value={currency || null}
									onValueChange={(val) => {
										if (val !== null) setCurrency(val);
									}}
								>
									<SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
										<SelectValue placeholder="Select currency">
											{(value) => {
												if (!value)
													return 'Select currency';
												const labels: Record<
													string,
													string
												> = {
													USD: 'USD - US Dollar',
													EUR: 'EUR - Euro',
													GBP: 'GBP - British Pound',
												};
												return (
													labels[value as string] ??
													value
												);
											}}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USD">
											USD - US Dollar
										</SelectItem>
										<SelectItem value="EUR">
											EUR - Euro
										</SelectItem>
										<SelectItem value="GBP">
											GBP - British Pound
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Line Items */}
					<div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold text-slate-900">
								Line Items
							</h2>
							<div className="flex gap-2">
								{clientId && (
									<button
										type="button"
										onClick={() => setPickerOpen(true)}
										className="flex items-center gap-1.5 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
									>
										<Clock className="h-3 w-3" />
										Import Time
										{unbilledSeconds != null &&
											unbilledSeconds > 0 && (
												<span className="ml-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
													{formatDurationShort(
														unbilledSeconds
													)}
												</span>
											)}
									</button>
								)}
								<button
									type="button"
									onClick={addLineItem}
									className="flex items-center gap-1.5 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
								>
									<Plus className="h-3 w-3" /> Add Item
								</button>
							</div>
						</div>

						<table className="w-full">
							<thead>
								<tr className="border-b border-[#E8ECF1]">
									<th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
										Description
									</th>
									<th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-20">
										Qty/Hrs
									</th>
									<th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">
										Rate
									</th>
									<th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">
										Amount
									</th>
									<th className="w-8" />
								</tr>
							</thead>
							<tbody>
								{lineItems.map((item, index) => {
									const amount = calculateLineAmount(item);
									return (
										<tr
											key={index}
											className="border-b border-[#E8ECF1] last:border-b-0"
										>
											<td className="py-3 pr-3">
												<input
													value={item.description}
													onChange={(e) =>
														updateLineItem(
															index,
															'description',
															e.target.value
														)
													}
													placeholder="Item description"
													className="w-full text-sm text-slate-900 outline-none"
												/>
											</td>
											<td className="py-3 pr-3">
												<input
													type="number"
													step="0.01"
													min="0"
													value={item.quantity}
													onChange={(e) =>
														updateLineItem(
															index,
															'quantity',
															parseFloat(
																e.target.value
															) || 0
														)
													}
													className="w-full text-sm text-slate-600 outline-none"
												/>
											</td>
											<td className="py-3 pr-3">
												<input
													type="number"
													step="1"
													min="0"
													value={item.unitPrice / 100}
													onChange={(e) =>
														updateLineItem(
															index,
															'unitPrice',
															Math.round(
																(parseFloat(
																	e.target
																		.value
																) || 0) * 100
															)
														)
													}
													placeholder="$0.00"
													className="w-full text-sm text-slate-600 outline-none"
												/>
											</td>
											<td className="py-3 text-right text-sm font-medium text-slate-900">
												{formatCurrency(
													amount,
													currency
												)}
											</td>
											<td className="py-3 pl-2">
												<button
													type="button"
													onClick={() =>
														removeLineItem(index)
													}
													disabled={
														lineItems.length <= 1
													}
													className="text-slate-300 hover:text-red-500 disabled:opacity-30"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* PDF download - only for existing invoices */}
					{isEditing && invoiceId && (
						<div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
							<div className="mb-4 flex items-center gap-2">
								<FileText className="h-5 w-5 text-red-500" />
								<h2 className="text-base font-semibold text-slate-900">
									Download as PDF
								</h2>
							</div>
							<a
								href={`/api/invoices/${invoiceId}/pdf`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F3D5F] py-3 text-sm font-medium text-white hover:bg-[#0C3350]"
							>
								<Download className="h-4 w-4" /> Download PDF
							</a>
						</div>
					)}
				</div>

				{/* Right column */}
				<div className="space-y-6">
					{/* Summary */}
					<div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
						<h2 className="mb-5 text-base font-semibold text-slate-900">
							Summary
						</h2>
						<div className="space-y-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-500">Subtotal</span>
								<span className="font-medium text-slate-900">
									{formatCurrency(subtotal, currency)}
								</span>
							</div>
							<div className="flex items-center justify-between text-sm">
								<span className="text-slate-500">
									{taxLabel}
								</span>
								<span className="font-medium text-slate-900">
									{formatCurrency(taxTotal, currency)}
								</span>
							</div>
							{discountTotal > 0 && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-slate-500">
										Discount
									</span>
									<span className="font-medium text-red-500">
										-
										{formatCurrency(
											discountTotal,
											currency
										)}
									</span>
								</div>
							)}
							<div className="border-t border-[#E8ECF1] pt-3 flex items-center justify-between">
								<span className="text-sm font-semibold text-slate-900">
									Total
								</span>
								<span className="text-xl font-bold text-[#0F3D5F]">
									{formatCurrency(total, currency)}
								</span>
							</div>
						</div>
					</div>

					{/* Payment Terms */}
					<div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
						<h2 className="mb-4 text-base font-semibold text-slate-900">
							Payment Terms
						</h2>
						<textarea
							value={paymentTerms}
							onChange={(e) => setPaymentTerms(e.target.value)}
							placeholder="e.g. Payment is due within 30 days of invoice date."
							rows={3}
							className="w-full rounded-lg border border-[#E8ECF1] bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
						/>
					</div>

					{/* Notes */}
					<div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
						<h2 className="mb-4 text-base font-semibold text-slate-900">
							Notes
						</h2>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any additional notes for the client..."
							rows={4}
							className="w-full rounded-lg border border-[#E8ECF1] bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none"
						/>
					</div>
				</div>
			</div>

			{/* Time Entry Picker */}
			{clientId && (
				<TimeEntryPicker
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					clientId={clientId}
					clientName={
						clients.find((c) => c.id === clientId)?.companyName ??
						'Client'
					}
					onSelect={handlePickerSelect}
				/>
			)}
		</form>
	);
}
