import React, { useRef, useState, useEffect } from 'react';

const ImageUploadSection = ({
  imageFile,
  imagePreview,
  onImageProcessed,
  onClearImage,
  showImageOptions,
  onToggleImageOptions,
  loading
}) => {
  const [imageCapturing, setImageCapturing] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Clean up video stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setImageCapturing(true);
      const constraints = { 
        video: { 
          facingMode: "environment", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions or try a different browser.");
      setImageCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setImageCapturing(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], "captured-image.jpeg", { type: "image/jpeg" });
        const imageUrl = URL.createObjectURL(blob);
        onImageProcessed(file, imageUrl);
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageProcessed(file, reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select an image file.");
    }
  };


  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="image-section">
      {imageCapturing ? (
        <div className="camera-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-preview"
          />
          <div className="camera-controls">
            <button
              type="button"
              onClick={captureImage}
              className="capture-btn"
              aria-label="Capture image"
            >
              <span className="capture-icon">📸</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : imagePreview ? (
        <div className="image-preview-container">
          <img src={imagePreview} alt="Item preview" className="item-preview" />
          <button
            type="button"
            onClick={onClearImage}
            className="clear-btn"
          >
            Remove Image
          </button>
        </div>
      ) : (
        <div className="image-upload-compact">
          {!showImageOptions ? (
            <button
              type="button"
              className="add-photo-btn"
              onClick={() => onToggleImageOptions(true)}
            >
              <span className="btn-icon">📸</span>
              Add Item Photo (Optional)
            </button>
          ) : (
            <div className="image-upload-expanded">
              <div className="upload-header">
                <h4>Add Item Photo</h4>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => onToggleImageOptions(false)}
                >
                  ✕
                </button>
              </div>

              <div className="upload-options">
                <div className="upload-buttons">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="upload-option-btn camera-btn"
                    aria-label="Start camera to capture image"
                  >
                    <span className="btn-icon">📷</span>
                    <span className="btn-text">Camera</span>
                  </button>
                  <button
                    type="button"
                    className="upload-option-btn upload-btn"
                    onClick={triggerFileInput}
                    aria-label="Upload image file"
                  >
                    <span className="btn-icon">📤</span>
                    <span className="btn-text">Upload File</span>
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
                hidden
                aria-label="Select image file"
              />
            </div>
          )}
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageUploadSection;