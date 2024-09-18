import { Box, Container, Flex, FormControl, FormLabel, Heading, Stack, Link as ChakraLink, Input, Button, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {Link, useNavigate} from "react-router-dom";
import { register } from "../lib/api";


const Register = () => {
    const navigate = useNavigate();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const {mutate: createAccount, isPending, isError, error} = useMutation({
    mutationFn: register,
    onSuccess: () => {
        navigate('/', {
            replace: true
        })
        // replace:true is used when we click back button after login. It wont allow you to go back.
    }
})
  return (
    <Flex minH="100vh" align="center" justify="center">
        <Container mx="auto" maxW="md" py={12} px={6} textalign="center">
        <Heading fontSize="4xl" mb={8}>
            Create an account
        </Heading>
        <Box rounded="lg" bg="gray.700" boxShadow="lg" p={8}>
            {isError && (
            <Box mb={3} color="red.400">{
                error?.message || "An error occurred"
            }</Box>
            )}

            <Stack spacing={4}>
                    <FormControl id="email">
                        <FormLabel>Email address</FormLabel>
                        <Input 
                        type="email" 
                        autoFocus 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                         />
                    </FormControl>

                    <FormControl id="password">
                        <FormLabel>Password</FormLabel>
                        <Input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                         />
                        <Text textAlign="left" fontSize="xs" color="text.muted">
                        Must be at least 6 characters long
                        </Text>
                    </FormControl>

                    <FormControl id="confirmPassword">
                        <FormLabel>Confirm Password</FormLabel>
                        <Input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={
                            (e) => e.key === "Enter" && createAccount({email, password, confirmPassword})
                        }
                         />
                    </FormControl>

                    <Button my={2} 
                        isDisabled={!email || password.length < 6 || password !== confirmPassword}
                        onClick={() => createAccount({email, password, confirmPassword})}
                        isLoading={isPending}
                     >
                        Create Account
                    </Button>
                    <Text align="center" fontSize="sm" color="text.muted">
                        Already have an account?
                        <ChakraLink as={Link} to="/login">
                            Sign In
                        </ChakraLink>
                    </Text>
            </Stack>

        </Box>
        </Container>
    </Flex>
  )
}

export default Register
