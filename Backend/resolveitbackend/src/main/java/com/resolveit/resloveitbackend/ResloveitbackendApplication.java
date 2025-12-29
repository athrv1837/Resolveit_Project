package com.resolveit.resloveitbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ResloveitbackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResloveitbackendApplication.class, args);
    }

}
