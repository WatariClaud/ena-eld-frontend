"use client";

import { Box, Button, Field, Input, Link, Stack, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { profile } from "./api/api";
import axios from "axios";
import { toaster } from "./components/ui/toaster";

interface FormValues {
  username: string;
  car_registration_number: string;
  password: string;
}

const Signup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = handleSubmit(async (data) => {
    console.log(data);
    try {
      const SignupData = await axios.post(profile, data);
      console.log({ SignupData });
      if(SignupData) localStorage.setItem("session_user", JSON.stringify(data));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const response  = error.response.data
      console.log(response)
      if(response.error) toaster.create({
          description: response.error,
          type: "error",
          closable: true,
          duration: 5000,
      })
    }
  });

  return (
    <Box className="j-center a-center" display="flex" h="100%" mt="10%">
      <Box className="white-bg border-7" p={7} w={500}>
        <Text fontWeight={700} fontSize="26px" textAlign="center" mb={10}>
          Create Account
        </Text>
        <form onSubmit={onSubmit}>
          <Stack gap="4" align="flex-start">
            <Field.Root invalid={!!errors.username}>
              <Field.Label>Driver name</Field.Label>
              <Input
                {...register("username", { required: "Required" })}
                w="100%"
              />
              <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.car_registration_number}>
              <Field.Label>Car registration</Field.Label>
              <Input
                {...register("car_registration_number", { required: "Required" })}
                w="100%"
              />
              <Field.ErrorText>
                {errors.car_registration_number?.message}
              </Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.car_registration_number}>
              <Field.Label>Password</Field.Label>
              <Input
                {...register("password", { required: "Required" })}
                w="100%"
                type="password"
              />
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>

            <Button
              type="submit"
              className="blue-bg white-color primary-button border-7"
              mt={5}
            >
              Submit
            </Button>
            <Link href="/">Exisitng account?</Link>
          </Stack>
        </form>
      </Box>
    </Box>
  );
};

export default Signup;
