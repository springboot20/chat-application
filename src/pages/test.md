useEffect(() => {
inputArray.forEach((input, index) => {
const currentInput = input.current;
const nextInput = input.current?.nextElementSibling;

      if (
        (currentInput?.value?.trim().length as number) > 1 &&
        currentInput?.value.trim().length === 2
      ) {
        currentInput.value = '';
      }

      if (nextInput !== null && nextInput?.hasAttribute('disabled') && currentInput?.value !== '') {
        nextInput.removeAttribute('disabled');
        inputArray[index].current?.focus();
      }

      input.current?.addEventListener('keyup', (event: KeyboardEvent) => {
        if (event.key === ' Backspace') {
          if (input.current?.previousElementSibling) {
            input!.current.value = '';
            input.current.setAttribute('disabled', "true");
            input.current.previousElementSibling.focus()
          }
        }
      });
    });
