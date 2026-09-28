import TextField from "@mui/material/TextField";

function TextInput(props) {
  return (
    <TextField
      fullWidth
      margin="normal"
      variant="outlined"
      {...props}
    />
  );
}

export default TextInput;