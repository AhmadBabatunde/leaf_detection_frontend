"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Leaf, Camera, CheckCircle, AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LeafDefectDetection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setProcessedImage(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("image/")) {
        handleFileSelect(file)
      }
    }
  }

  const analyzeLeaf = async () => {
    if (!selectedFile) {
      setResult("Please select an image first!")
      return
    }

    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append("image", selectedFile)

    try {
      //const response = await fetch("http://localhost:5000/analyze", 
      const response = await fetch("https://leaf-detection-backend.onrender.com",{
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()
      setResult(data.result)

      if (data.image) {
        setProcessedImage(`data:image/jpeg;base64,${data.image}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setProcessedImage(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const isHealthy = result?.toLowerCase().includes("healthy")
  const hasDefect = result && !isHealthy && !result.toLowerCase().includes("error")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Crop Defect Detection</h1>
          <p className="text-gray-600 text-lg">Upload a crop image to detect diseases and defects using YOLOv8 model</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Upload Image
              </h2>

              {/* Drag and Drop Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  isDragOver
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">Drop your crop image here</p>
                    <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                  </div>
                  <p className="text-xs text-gray-400">Supports JPG, PNG, WebP formats</p>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Original Image</h3>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Uploaded leaf"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={analyzeLeaf}
                  disabled={!selectedFile || isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Leaf className="w-4 h-4 mr-2" />
                      Analyze Leaf
                    </>
                  )}
                </Button>

                {(imagePreview || result) && (
                  <Button onClick={resetAnalysis} variant="outline" className="border-gray-300 hover:bg-gray-50">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Analysis Results</h2>

              {!result && !processedImage && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Leaf className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Upload an image to see analysis results</p>
                </div>
              )}

              {/* Analysis Result */}
              {result && (
                <div
                  className={`p-4 rounded-lg mb-6 ${
                    isHealthy
                      ? "bg-green-50 border border-green-200"
                      : hasDefect
                        ? "bg-red-50 border border-red-200"
                        : "bg-yellow-50 border border-yellow-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isHealthy ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${isHealthy ? "text-green-800" : "text-red-800"}`}>
                        {isHealthy ? "Healthy Leaf Detected" : "Defect Detected"}
                      </h3>
                      <p className={`text-sm mt-1 ${isHealthy ? "text-green-700" : "text-red-700"}`}>{result}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Processed Image */}
              {processedImage && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Processed Image with Detection</h3>
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={processedImage || "/placeholder.svg"}
                      alt="Processed leaf with detection"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Easy Upload</h3>
            <p className="text-sm text-gray-600">Simply drag and drop or click to upload your crop images</p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">AI Analysis</h3>
            <p className="text-sm text-gray-600">Advanced YOLOv8 (you only look once) model to detect diseases and defects</p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto bg-cyan-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Instant Results</h3>
            <p className="text-sm text-gray-600">Get detailed analysis results with visual annotations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
