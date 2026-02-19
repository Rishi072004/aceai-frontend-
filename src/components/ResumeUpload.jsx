import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ResumeUpload = ({ onResumeSelect, selectedResumeId }) => {
  const [resumes, setResumes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();

  // Load user resumes
  const loadResumes = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/resumes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load resumes');
      }

      const data = await response.json();
      setResumes(data.data.resumes || []);
    } catch (error) {
      console.error('Error loading resumes:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    await uploadResume(file);
  };

  // Upload resume
  const uploadResume = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload resume');
      }

      const data = await response.json();
      
      toast({
        title: "Resume Uploaded",
        description: "Your resume has been analyzed successfully!",
        duration: 3000
      });

      // Add to resumes list
      setResumes(prev => [data.data.resume, ...prev]);
      
      // Show analysis
      setSelectedResume(data.data.resume);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete resume
  const deleteResume = async (resumeId) => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      setResumes(prev => prev.filter(r => r.id !== resumeId));
      
      if (selectedResumeId === resumeId) {
        onResumeSelect?.(null);
      }

      toast({
        title: "Resume Deleted",
        description: "Resume has been removed successfully.",
        duration: 2000
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // View resume details
  const viewResumeDetails = async (resumeId) => {
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load resume details');
      }

      const data = await response.json();
      setSelectedResume(data.data.resume);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Error loading resume details:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Select resume for interview
  const selectResumeForInterview = (resumeId) => {
    onResumeSelect?.(resumeId);
    toast({
      title: "Resume Selected",
      description: "Interview questions will be tailored to your resume.",
      duration: 2000
    });
  };

  // Load resumes on mount
  useEffect(() => {
    loadResumes();
  }, [isAuthenticated]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume Upload
          </CardTitle>
          <CardDescription>
            Upload your resume to get personalized interview questions based on your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Button */}
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="resume-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">Analyzing resume...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, or DOCX (Max 5MB)
                    </p>
                  </>
                )}
              </div>
              <input
                id="resume-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Resume List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : resumes.length > 0 ? (
            <div className="space-y-2">
              <Separator />
              <h3 className="text-sm font-semibold">Your Resumes</h3>
              {resumes.map((resume) => (
                <Card key={resume.id} className={selectedResumeId === resume.id ? "border-primary" : ""}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{resume.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {resume.primaryRole || 'Analyzing...'}
                          </Badge>
                          {resume.yearsOfExperience > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {resume.yearsOfExperience} years
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {resume.fileSize}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => viewResumeDetails(resume.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedResumeId === resume.id ? "default" : "outline"}
                        onClick={() => selectResumeForInterview(resume.id)}
                      >
                        {selectedResumeId === resume.id ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Selected
                          </>
                        ) : (
                          "Use for Interview"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteResume(resume.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No resumes uploaded yet. Upload one to get started!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resume Analysis Modal/Panel */}
      {showAnalysis && selectedResume && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resume Analysis</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAnalysis(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Overview</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Primary Role</p>
                  <p className="text-sm font-medium">{selectedResume.analysis?.primaryRole}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium">
                    {selectedResume.analysis?.yearsOfExperience} years
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Technical Skills */}
            {selectedResume.analysis?.technicalSkills?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedResume.analysis.technicalSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {selectedResume.analysis?.softSkills?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedResume.analysis.softSkills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {selectedResume.analysis?.strengths?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Key Strengths</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedResume.analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Topics */}
            {selectedResume.analysis?.suggestedInterviewTopics?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Interview Topics</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedResume.analysis.suggestedInterviewTopics.map((topic, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => selectResumeForInterview(selectedResume.id)}
            >
              Use This Resume for Interview
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeUpload;

