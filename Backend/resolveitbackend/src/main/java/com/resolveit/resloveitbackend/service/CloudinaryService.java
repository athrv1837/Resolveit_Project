package com.resolveit.resloveitbackend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "resource_type", "auto",
                    "folder", folder,
                    "public_id", System.currentTimeMillis() + "_" + file.getOriginalFilename()
                )
            );
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            throw new IOException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * Upload multiple files to Cloudinary
     * @param files array of files to upload
     * @param folder the folder in Cloudinary
     * @return list of secure URLs
     */
    public List<String> uploadFiles(MultipartFile[] files, String folder) throws IOException {
        List<String> urls = new ArrayList<>();
        if (files == null || files.length == 0) {
            return urls;
        }

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                try {
                    String url = uploadFile(file, folder);
                    urls.add(url);
                } catch (IOException e) {
                    System.err.println("Failed to upload file: " + file.getOriginalFilename() + " - " + e.getMessage());
                }
            }
        }
        return urls;
    }

    /**
     * Delete a file from Cloudinary using its public ID
     * @param publicId the public ID of the file in Cloudinary
     */
    public void deleteFile(String publicId) throws IOException {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new IOException("Failed to delete file from Cloudinary: " + e.getMessage(), e);
        }
    }
}
