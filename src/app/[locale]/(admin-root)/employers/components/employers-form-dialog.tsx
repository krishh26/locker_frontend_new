"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateEmployerMutation,
  useUpdateEmployerMutation,
  useUploadEmployerFileMutation,
} from "@/store/api/employer/employerApi";
import type {
  Employer,
  CreateEmployerRequest,
  UpdateEmployerRequest,
} from "@/store/api/employer/types";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

const businessCategories = [
  "Media and creative services",
  "Mining, energy and utilities",
  "Personal services",
  "Professional and business services",
  "Retail, hire and repair",
  "Transport and distribution",
  "Wholesale",
  "Agriculture, forestry and fishing",
  "Arts, sports and recreation",
  "Catering and accommodation",
  "Construction",
  "Education",
  "Health and social care services",
  "IT and telecommunications services",
  "Manufacturing",
  "Animal Care",
];

const createEmployerSchema = z.object({
  employer_name: z.string().min(1, "Company Name is required"),
  msi_employer_id: z.string().min(1, "MIS ID is required"),
  business_department: z.string().optional(),
  business_location: z.string().optional(),
  branch_code: z.string().optional(),
  address_1: z.string().min(1, "Address 1 is required"),
  address_2: z.string().min(1, "Address 2 is required"),
  city: z.string().min(1, "Town is required"),
  employer_county: z.string().min(1, "County is required"),
  country: z.string().min(1, "Country is required"),
  postal_code: z.string().min(1, "Postcode is required"),
  business_category: z.string().optional(),
  number_of_employees: z.string().optional(),
  telephone: z.string().optional(),
  website: z.string().optional(),
  key_contact_name: z.string().optional(),
  key_contact_number: z.string().optional(),
  email: z.email("Invalid email address"),
  business_description: z.string().optional(),
  comments: z.string().optional(),
  assessment_date: z.string().optional(),
  assessment_renewal_date: z.string().optional(),
  insurance_renewal_date: z.string().optional(),
});

const updateEmployerSchema = createEmployerSchema.partial();

type CreateEmployerFormValues = z.infer<typeof createEmployerSchema>;
type UpdateEmployerFormValues = z.infer<typeof updateEmployerSchema>;

interface EmployersFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employer: Employer | null;
  onSuccess: () => void;
}

export function EmployersFormDialog({
  open,
  onOpenChange,
  employer,
  onSuccess,
}: EmployersFormDialogProps) {
  const isEditMode = !!employer;
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authUser = useAppSelector((state) => state.auth.user);
  const [createEmployer, { isLoading: isCreating }] = useCreateEmployerMutation();
  const [updateEmployer, { isLoading: isUpdating }] = useUpdateEmployerMutation();
  const [uploadFile] = useUploadEmployerFileMutation();

  const form = useForm<CreateEmployerFormValues | UpdateEmployerFormValues>({
    resolver: zodResolver(isEditMode ? updateEmployerSchema : createEmployerSchema),
    defaultValues: {
      employer_name: "",
      msi_employer_id: "",
      business_department: "",
      business_location: "",
      branch_code: "",
      address_1: "",
      address_2: "",
      city: "",
      employer_county: "",
      country: "",
      postal_code: "",
      business_category: "",
      number_of_employees: "",
      telephone: "",
      website: "",
      key_contact_name: "",
      key_contact_number: "",
      email: "",
      business_description: "",
      comments: "",
      assessment_date: "",
      assessment_renewal_date: "",
      insurance_renewal_date: "",
    },
  });

  useEffect(() => {
    if (employer && open) {
      form.reset({
        employer_name: employer.employer_name || "",
        msi_employer_id: employer.msi_employer_id || "",
        business_department: employer.business_department || "",
        business_location: employer.business_location || "",
        branch_code: employer.branch_code || "",
        address_1: employer.address_1 || "",
        address_2: employer.address_2 || "",
        city: employer.city || "",
        employer_county: employer.employer_county || "",
        country: employer.country || "",
        postal_code: employer.postal_code || "",
        business_category: employer.business_category || "",
        number_of_employees: employer.number_of_employees || "",
        telephone: employer.telephone || "",
        website: employer.website || "",
        key_contact_name: employer.key_contact_name || "",
        key_contact_number: employer.key_contact_number || "",
        email: employer.email || "",
        business_description: employer.business_description || "",
        comments: employer.comments || "",
        assessment_date: employer.assessment_date
          ? employer.assessment_date.split("T")[0]
          : "",
        assessment_renewal_date: employer.assessment_renewal_date
          ? employer.assessment_renewal_date.split("T")[0]
          : "",
        insurance_renewal_date: employer.insurance_renewal_date
          ? employer.insurance_renewal_date.split("T")[0]
          : "",
      });
      if (employer.file) {
        setUploadedFileUrl(employer.file.url);
      }
    } else if (!employer && open) {
      form.reset({
        employer_name: "",
        msi_employer_id: "",
        business_department: "",
        business_location: "",
        branch_code: "",
        address_1: "",
        address_2: "",
        city: "",
        employer_county: "",
        country: "",
        postal_code: "",
        business_category: "",
        number_of_employees: "",
        telephone: "",
        website: "",
        key_contact_name: "",
        key_contact_number: "",
        email: "",
        business_description: "",
        comments: "",
        assessment_date: "",
        assessment_renewal_date: "",
        insurance_renewal_date: "",
      });
      setUploadedFile(null);
      setUploadedFileUrl(null);
    }
  }, [employer, open, form]);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setUploadedFile(null);
      setUploadedFileUrl(null);
      return;
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFileUploading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await uploadFile(formData).unwrap();
      if (response.data && response.data.length > 0) {
        setUploadedFileUrl(response.data[0].url);
        toast.success("File uploaded successfully");
      }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to upload file");
      setUploadedFile(null);
    } finally {
      setFileUploading(false);
    }
  };

  const onSubmit = async (values: CreateEmployerFormValues | UpdateEmployerFormValues) => {
    try {
      const payload: CreateEmployerRequest | UpdateEmployerRequest = {
        ...values,
        file: uploadedFileUrl
          ? {
              url: uploadedFileUrl,
              key: uploadedFileUrl,
            }
          : employer?.file || null,
      };
      if (authUser?.assignedOrganisationIds?.length) {
        payload.organisation_ids = authUser.assignedOrganisationIds.map((id) => Number(id));
      }

      if (isEditMode) {
        await updateEmployer({
          id: employer.employer_id,
          data: payload as UpdateEmployerRequest,
        }).unwrap();
        toast.success("Employer updated successfully");
      } else {
        await createEmployer(payload as CreateEmployerRequest).unwrap();
        toast.success("Employer created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || `Failed to ${isEditMode ? "update" : "create"} employer`);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw]! sm:max-w-[90vw]! lg:max-w-[1400px]! xl:max-w-[1600px]! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Employer" : "Create Employer"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update employer information below."
              : "Fill in the employer information below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Company</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employer_name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employer_name"
                  {...form.register("employer_name")}
                  placeholder="Company name"
                />
                {form.formState.errors.employer_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.employer_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="msi_employer_id">
                  MIS ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="msi_employer_id"
                  type="number"
                  {...form.register("msi_employer_id")}
                  placeholder="Enter ID"
                />
                {form.formState.errors.msi_employer_id && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.msi_employer_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_department">Business Department</Label>
                <Input
                  id="business_department"
                  {...form.register("business_department")}
                  placeholder="Business Department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_location">Business Location</Label>
                <Input
                  id="business_location"
                  {...form.register("business_location")}
                  placeholder="Business Location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_code">Branch Code</Label>
                <Input
                  id="branch_code"
                  type="number"
                  {...form.register("branch_code")}
                  placeholder="Branch Code"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_1">
                  Address 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address_1"
                  {...form.register("address_1")}
                  placeholder="Address"
                />
                {form.formState.errors.address_1 && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.address_1.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_2">
                  Address 2 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address_2"
                  {...form.register("address_2")}
                  placeholder="Address"
                />
                {form.formState.errors.address_2 && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.address_2.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  Town <span className="text-destructive">*</span>
                </Label>
                <Input id="city" {...form.register("city")} placeholder="City" />
                {form.formState.errors.city && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employer_county">
                  County <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employer_county"
                  {...form.register("employer_county")}
                  placeholder="County"
                />
                {form.formState.errors.employer_county && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.employer_county.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  {...form.register("country")}
                  placeholder="Country"
                />
                {form.formState.errors.country && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">
                  Postcode <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="postal_code"
                  {...form.register("postal_code")}
                  placeholder="e.g., SW1A 1AA"
                />
                {form.formState.errors.postal_code && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.postal_code.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_category">Business Category</Label>
                <Controller
                  name="business_category"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      value={field.value || "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select Category</SelectItem>
                        {businessCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number_of_employees">Number of Employees</Label>
                <Input
                  id="number_of_employees"
                  type="number"
                  {...form.register("number_of_employees")}
                  placeholder="Number of employees"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Telephone</Label>
                <Input
                  id="telephone"
                  {...form.register("telephone")}
                  placeholder="Telephone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register("website")}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_contact_name">Key Contact Name</Label>
                <Input
                  id="key_contact_name"
                  {...form.register("key_contact_name")}
                  placeholder="Contact Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_contact_number">Key Contact Number</Label>
                <Input
                  id="key_contact_number"
                  {...form.register("key_contact_number")}
                  placeholder="Contact Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="Email"
                  disabled={isEditMode}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Business Description/Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Business Description / Comments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_description">Business Description</Label>
                <Textarea
                  id="business_description"
                  {...form.register("business_description")}
                  placeholder="Business Description"
                  rows={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  {...form.register("comments")}
                  placeholder="Comments"
                  rows={8}
                />
              </div>
            </div>
          </div>

          {/* Assessment Date Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Assessment Date</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assessment_date">
                  Health and Safety Assessment Date
                </Label>
                <Input
                  id="assessment_date"
                  type="date"
                  {...form.register("assessment_date")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assessment_renewal_date">
                  Health and Safety Assessment Renewal Date
                </Label>
                <Input
                  id="assessment_renewal_date"
                  type="date"
                  {...form.register("assessment_renewal_date")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance_renewal_date">
                  Liability Insurance Renewal Date
                </Label>
                <Input
                  id="insurance_renewal_date"
                  type="date"
                  {...form.register("insurance_renewal_date")}
                />
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">File Upload</h3>
            <div className="space-y-2">
              <Label>Choose File for Employer (PDF only, max 10MB)</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileChange(file);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fileUploading}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {fileUploading
                    ? "Uploading..."
                    : uploadedFile
                    ? uploadedFile.name
                    : uploadedFileUrl
                    ? "File uploaded"
                    : "Choose File"}
                </Button>
                {(uploadedFile || uploadedFileUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      handleFileChange(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={fileUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadedFileUrl && (
                <p className="text-sm text-muted-foreground">
                  File uploaded: {uploadedFileUrl.split("/").pop()}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || fileUploading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

