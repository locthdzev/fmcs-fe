import { Box, Button, Container, Typography } from "@mui/material";
import { useRouter } from "next/router";
import Image from "next/image";

export default function Custom404() {
  const router = useRouter();

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Image
          src="/images/web-error.png"
          alt="404 Error"
          width={300}
          height={225}
          priority
        />

        <Typography
          variant="h1"
          sx={{ fontSize: "4rem", fontWeight: "bold", color: "primary.main" }}
        >
          404
        </Typography>

        <Typography variant="h4" sx={{ mb: 2 }}>
          Page Not Found
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The page you are looking for does not exist or has been moved
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={() => router.push("/home")}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
}
