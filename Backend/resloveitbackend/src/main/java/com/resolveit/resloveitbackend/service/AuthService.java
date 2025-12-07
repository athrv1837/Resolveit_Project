package com.resolveit.resloveitbackend.service;

import com.resolveit.resloveitbackend.dto.AuthResponse;
import com.resolveit.resloveitbackend.dto.RegisterRequest;

public interface AuthService {
    AuthResponse login(String email, String rawPassword);
    AuthResponse register(RegisterRequest req);
}
