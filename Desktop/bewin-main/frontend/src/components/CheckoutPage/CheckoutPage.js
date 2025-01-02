import React, { useContext, useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import { Formik, Form } from "formik";
import AddressForm from "./Forms/AddressForm";
import PaymentForm from "./Forms/PaymentForm";
import ReviewOrder from "./ReviewOrder";
import CheckoutSuccess from "./CheckoutSuccess";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";
import validationSchema from "./FormModel/validationSchema";
import checkoutFormModel from "./FormModel/checkoutFormModel";
import formInitialValues from "./FormModel/formInitialValues";
import useStyles from "./styles";

export default function CheckoutPage(props) {
  const steps = ["Dados", "Personalizar", "Revisar"];
  const { formId, formField } = checkoutFormModel;

  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(1);
  const [datePayment, setDatePayment] = useState(null);
  const [invoiceId, setInvoiceId] = useState(props.Invoice.id);
  const currentValidationSchema = validationSchema[activeStep];
  const isLastStep = activeStep === steps.length - 1;
  const { user } = useContext(AuthContext);

  // Adicionando console.log para verificar o user
  console.log("Dados do usuário:", user);

  function _renderStepContent(step, setFieldValue, setActiveStep, values) {
    switch (step) {
      case 0:
        return <AddressForm formField={formField} values={values} setFieldValue={setFieldValue} />;
      case 1:
        return (
          <PaymentForm
            formField={formField}
            setFieldValue={setFieldValue}
            setActiveStep={setActiveStep}
            activeStep={step}
            invoiceId={invoiceId}
            values={values}
          />
        );
      case 2:
        return (
          <ReviewOrder 
            firstName={values.firstName}
            lastName={values.lastName}
            cpf={values.cpf}
          />
        );
      default:
        return <div>Not Found</div>;
    }
  }

  async function _submitForm(values, actions) {
    try {
      const plan = JSON.parse(values.plan);
      const newValues = {
        firstName: values.firstName,
        lastName: values.lastName,
        cpf: values.cpf,
        address2: values.address2,
        city: values.city,
        state: values.state,
        zipcode: values.zipcode,
        country: values.country,
        useAddressForPaymentDetails: values.useAddressForPaymentDetails,
        nameOnCard: values.nameOnCard,
        cardNumber: values.cardNumber,
        cvv: values.cvv,
        plan: values.plan,
        price: plan.price,
        users: plan.users,
        connections: plan.connections,
        invoiceId: invoiceId
      };

      const { data } = await api.post("/subscription", newValues);
      setDatePayment(data);
      actions.setSubmitting(false);
      setActiveStep(activeStep + 1);
      toast.success("Assinatura realizada com sucesso!, aguardando a realização do pagamento");
    } catch (err) {
      toastError(err);
    }
  }

  function _handleSubmit(values, actions) {
    if (isLastStep) {
      _submitForm(values, actions);
    } else {
      setActiveStep(activeStep + 1);
      actions.setTouched({});
      actions.setSubmitting(false);
    }
  }

  function _handleBack() {
    setActiveStep(activeStep - 1);
  }

  return (
    <React.Fragment>
      <Typography component="h1" variant="h4" align="center">
        Falta pouco!
      </Typography>
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <React.Fragment>
        {activeStep === steps.length ? (
          <CheckoutSuccess pix={datePayment} />
        ) : (
          <Formik
            initialValues={{
              firstName: user?.company?.name || '',
              lastName: '', // Preencha aqui se tiver um sobrenome
              cpf: user?.company?.document || '',
              ...formInitialValues
            }}
            validationSchema={currentValidationSchema}
            onSubmit={_handleSubmit}
          >
            {({ isSubmitting, setFieldValue, values }) => (
              <Form id={formId}>
                {_renderStepContent(activeStep, setFieldValue, setActiveStep, values)}

                <div className={classes.buttons}>
                  {activeStep !== 1 && activeStep !== 0 && (
                    <Button onClick={_handleBack} className={classes.button}>
                      VOLTAR
                    </Button>
                  )}
                  <div className={classes.wrapper}>
                    {activeStep !== 1 && (
                      <Button
                        disabled={isSubmitting}
                        type="submit"
                        variant="contained"
                        color="primary"
                        className={classes.button}
                      >
                        {isLastStep ? "PAGAR" : "PRÓXIMO"}
                      </Button>
                    )}
                    {isSubmitting && (
                      <CircularProgress size={24} className={classes.buttonProgress} />
                    )}
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </React.Fragment>
    </React.Fragment>
  );
}