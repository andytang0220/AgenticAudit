from connectors.deepseek_connector import deepseek_chat


if __name__ == '__main__':
    response = deepseek_chat("Hello! Who are you?")
    print(response)
