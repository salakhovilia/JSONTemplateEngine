import JSONTemplateEngine from "../src";

describe("Base compile values", () => {
  const data = {
    test: "test"
  };
  const templateEngine = new JSONTemplateEngine();
  test("should be return boolean", () => {
    expect(templateEngine.compile(true, {})).resolves.toEqual(true);
  });
  test("should be return number", () => {
    expect(templateEngine.compile(0, {})).resolves.toEqual(0);
  });
  test("should be return string", () => {
    expect(templateEngine.compile("test", {})).resolves.toEqual("test");
  });
  test("should be return compiled string", () => {
    expect(templateEngine.compile("{{test}}", data)).resolves.toEqual("test");
  });
  test("should be return object", () => {
    expect(templateEngine.compile({ test: "test" }, {})).resolves.toEqual({ test: "test" });
  });
  test("should be return compiled string value of object", () => {
    expect(templateEngine.compile({ test: "{{test}}" }, data)).resolves.toEqual({ test: "test" });
  });
  test("should be return compiled string value of array", () => {
    expect(templateEngine.compile(["{{test}}"], data)).resolves.toEqual(["test"]);
  });
  test("should be throw exception when add already exist helper", () => {
    expect(() => {
      templateEngine.registerHelper("if", () => {
        return "";
      });
    }).toThrowError();
  });
  test("should be throw exception when add already exist helper function", () => {
    expect(() => {
      templateEngine.registerFunctionHelper("range", () => {
        return "";
      });
    }).toThrowError();
  });
  test("should be throw exception when invalid expression", () => {
    expect(templateEngine.compile("{{isNotDefinedValue}}")).rejects.toThrowError();
  });
  test("should be return value from function", () => {
    expect(
      templateEngine.compile("{{callbackValue}}", {
        callbackValue: () => "test"
      })
    ).resolves.toBe("test");
  });
  test("should be change 'command' to 'testCommand'", () => {
    const testCommandEngine = new JSONTemplateEngine({ keyHelper: "testCommand" });
    expect(
      testCommandEngine.compile({
        testCommand: "if",
        input: true,
        outputs: [{ name: "then", template: "test" }]
      })
    ).resolves.toBe("test");
  });
});

describe("if helper", () => {
  const data = {
    state: true
  };
  const templateEngine = new JSONTemplateEngine();
  test("should be return then template", () => {
    expect(
      templateEngine.compile(
        {
          command: "if",
          input: true,
          outputs: [{ name: "then", template: "isThen" }]
        },
        data
      )
    ).resolves.toEqual("isThen");
  });
  test("should be return false template", () => {
    expect(
      templateEngine.compile(
        {
          command: "if",
          input: false,
          outputs: [
            { name: "then", template: "isThen" },
            { name: "else", template: "isFalse" }
          ]
        },
        data
      )
    ).resolves.toEqual("isFalse");
  });
  test("should be before parse if compile input", () => {
    expect(
      templateEngine.compile(
        {
          command: "if",
          input: "{{state}}",
          outputs: [
            { name: "then", template: "isThen" },
            { name: "else", template: "isFalse" }
          ]
        },
        data
      )
    ).resolves.toEqual("isThen");
  });
  test("should be parse output template", () => {
    expect(
      templateEngine.compile(
        {
          command: "if",
          input: "{{state}}",
          outputs: [
            { name: "then", template: "state is {{state}}" },
            { name: "else", template: "state is {{state}}" }
          ]
        },
        data
      )
    ).resolves.toEqual("state is true");
  });
});

describe("each helper", () => {
  const templateEngine = new JSONTemplateEngine();
  test("should be return array compiled strings", () => {
    expect(
      templateEngine.compile({
        command: "each",
        input: [0, 1, 2],
        outputs: "index: {{iteration.index}}; value: {{iteration.value}}"
      })
    ).resolves.toEqual(["index: 0; value: 0", "index: 1; value: 1", "index: 2; value: 2"]);
  });
  test("should be throw error when input is not array", () => {
    expect(
      templateEngine.compile(
        {
          command: "each",
          input: 123,
          outputs: "index: {{iteration.index}}; value: {{iteration.value}}"
        },
        {}
      )
    ).rejects.toThrow();
  });

  test("should be compile input range helper function", () => {
    expect(
      templateEngine.compile({
        command: "each",
        input: "#range(3)",
        outputs: "index: {{iteration.index}}; value: {{iteration.value}}"
      })
    ).resolves.toEqual(["index: 0; value: 0", "index: 1; value: 1", "index: 2; value: 2"]);
  });
});
