import React from "react";
import { Calendar, MapPin, MessageSquare, FileImage, User } from "lucide-react";
import { Complaint } from "../../types";

// ✅ Updated Props — now includes showPriority
interface ComplaintCardProps {
  complaint: Complaint;
  isSelected?: boolean;
  onSelect?: (complaint: Complaint) => void;
  showStatus?: boolean;
  showPriority?: boolean;  // ← ADDED THIS
  compact?: boolean;
  children?: React.ReactNode;
}

const getStatusStyles = (status?: string) => {
  switch (status) {
    case "pending":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "assigned":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
    case "in-progress":
      return {
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        text: "text-cyan-700",
        dot: "bg-cyan-500",
      };
    case "resolved":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        dot: "bg-green-500",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-700",
        dot: "bg-slate-500",
      };
  }
};

const getPriorityStyles = (priority?: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "low":
      return "bg-green-100 text-green-700 border-green-200";
    case "urgent":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  isSelected,
  onSelect,
  showStatus = true,
  showPriority = false,  // ← Default false
  compact = false,
  children,
}) => {
  // Safe defaults
  const safeStatus = complaint?.status || "pending";
  const safePriority = complaint?.priority || "medium";
  const safeCategory = complaint?.category || "General";
  const safeTitle = complaint?.title || "Untitled Complaint";
  const safeDescription = complaint?.description || "No description available.";
  const safeDate = complaint?.submittedAt
    ? new Date(complaint.submittedAt)
    : new Date();
  const repliesCount = complaint?.replies?.length || 0;

  const statusStyles = getStatusStyles(safeStatus);

  return (
    <div
      onClick={() => onSelect?.(complaint)}
      className={`card p-6 transition-all duration-300 border-2 border-slate-200/60 ${
        onSelect ? "cursor-pointer hover:shadow-2xl hover:shadow-blue-200/40 hover:scale-[1.03] hover:border-blue-300/80" : ""
      } ${isSelected ? "ring-4 ring-cyan-400 shadow-2xl shadow-cyan-200/50 scale-[1.03] border-cyan-400" : ""} ${
        compact ? "p-4" : ""
      } animate-fade-in bg-gradient-to-br from-white to-slate-50/30`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {/* Grievance ID (Government style) */}
            <span className="font-mono text-sm font-extrabold text-cyan-700 tracking-wider bg-cyan-50 px-3 py-1.5 rounded-lg border-2 border-cyan-200">
              {complaint.referenceNumber || `GRV-${complaint.id || "XXXX"}`}
            </span>

            {/* Status Badge */}
            {showStatus && (
              <span
                className={`${statusStyles.bg} ${statusStyles.text} px-3.5 py-2 rounded-full text-xs font-extrabold border-2 ${statusStyles.border} flex items-center gap-2 whitespace-nowrap shadow-md`}
              >
                <span className={`w-3 h-3 rounded-full ${statusStyles.dot} animate-pulse shadow-lg`}></span>
                {safeStatus.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}

            {/* Priority Badge — SHOW FOR GOVERNMENT TRACKING */}
            {showPriority && (
              <span
                className={`px-3.5 py-2 rounded-full text-xs font-extrabold border-2 ${getPriorityStyles(
                  safePriority
                )} whitespace-nowrap shadow-md`}
              >
                {safePriority.toUpperCase()} PRIORITY
              </span>
            )}

            {/* Assigned Officer & Department */}
            {complaint.assignedTo && (
              <span className="ml-2 text-xs text-slate-700 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-bold">{complaint.assignedTo}</span>
                {complaint.assignedDepartment && (
                  <span className="text-slate-600 px-2 py-1 bg-white rounded border border-slate-300 font-semibold">
                    {complaint.assignedDepartment}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-extrabold text-slate-900 mb-3 line-clamp-2 tracking-tight ${
              compact ? "text-lg" : "text-xl"
            }`}
          >
            {safeTitle}
          </h3>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed font-medium">
              {safeDescription}
            </p>
          )}
        </div>
      </div>

      {/* Audit Metadata (Government Compliance) */}
      {complaint.lastUpdatedAt && (
        <div className="text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
          <span>
            Last updated: {new Date(complaint.lastUpdatedAt).toLocaleDateString()} by {complaint.lastUpdatedBy || "System"}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {/* Submission Date */}
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4" />
            {safeDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>

          {/* Category */}
          <span className="hidden md:flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {safeCategory}
          </span>
          
          {/* Attachments/Documents */}
          {(complaint.attachments && complaint.attachments.length > 0 || complaint.attachmentCount) && (
            <span className="flex items-center gap-1.5">
              <FileImage className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">{complaint.attachmentCount || complaint.attachments?.length || 0} doc(s)</span>
            </span>
          )}
        </div>

        {/* Replies */}
        {repliesCount > 0 && (
          <span className="flex items-center gap-1.5 font-bold text-cyan-600">
            <MessageSquare className="w-4 h-4" />
            {repliesCount} {repliesCount === 1 ? "Reply" : "Replies"}
          </span>
        )}
      </div>

      {/* Expanded area for selected complaint: children (e.g., reply form) and replies list */}
      {isSelected && (children || complaint.replies?.length > 0) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {/* Render passed children (reply form etc) */}
          {children}

          {/* Replies list (public) */}
          {complaint.replies && complaint.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {complaint.replies.map((r: any) => (
                <div key={r.id || r.createdAt || Math.random()} className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {r.isAdminReply ? 'Authority' : r.authorName || 'Citizen'}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">• {new Date(r.createdAt || r.timestamp || r.created || Date.now()).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-700">{r.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};